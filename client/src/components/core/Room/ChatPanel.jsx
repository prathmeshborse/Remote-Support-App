// File path: client/src/components/core/Room/ChatPanel.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  onSendMessage,
  dataChannel,
  isAgent,
  onFileLogged
}) {
  const fileInputRef = useRef(null);
  
  // Real-time states for file sharing
  const [transferProgress, setTransferProgress] = useState(null); // { name, progress, type: "sending"|"receiving" }
  const [sharedFiles, setSharedFiles] = useState([]); // [{ fileName, fileSize, fileType, senderRole, downloadUrl }]

  const isDataChannelOpen = dataChannel?.readyState === "open";

  // Safeguard arraybuffer binary type assignment
  useEffect(() => {
    if (dataChannel) {
      dataChannel.binaryType = "arraybuffer";
    }
  }, [dataChannel]);

  // ----------------------------------------------------------------
  // P2P SENDER: Slices files into 16KB binary chunks and transmits P2P
  // ----------------------------------------------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !isDataChannelOpen) return;

    setTransferProgress({ name: file.name, progress: 0, type: "sending" });

    // 1. Send the file metadata header packet over the channel
    dataChannel.send(JSON.stringify({
      type: "file-meta",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      senderRole: isAgent ? "agent" : "client"
    }));

    const CHUNK_SIZE = 16384; // 16KB WebRTC chunk safety limit
    const fileReader = new FileReader();
    let offset = 0;

    // Slices and sends the next chunk
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };

    fileReader.onload = async (event) => {
      const chunk = event.target.result;
      dataChannel.send(chunk); // Send raw binary ArrayBuffer over the channel
      offset += chunk.byteLength;

      // Update local progress bar
      const progress = Math.round((offset / file.size) * 100);
      setTransferProgress({ name: file.name, progress, type: "sending" });

      // WebRTC Backpressure / Buffer Flow Control
      // If the outgoing queue exceeds 1MB, pause sending until buffer clears safely below 64KB
      if (dataChannel.bufferedAmount > 1048576) {
        await new Promise((resolve) => {
          const checkBuffer = () => {
            if (dataChannel.bufferedAmount < 65536) {
              resolve();
            } else {
              setTimeout(checkBuffer, 50); // Poll every 50ms
            }
          };
          checkBuffer();
        });
      }

      if (offset < file.size) {
        readNextChunk(); // Load next chunk
      } else {
        // 2. All chunks sent successfully. Send footer packet over WebRTC
        dataChannel.send(JSON.stringify({ type: "file-end" }));
        setTransferProgress(null);
        toast.success("File sent successfully!");

        const fileMeta = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          senderRole: isAgent ? "agent" : "client"
        };

        // Append to local list
        setSharedFiles((prev) => [...prev, { ...fileMeta, isLocal: true }]);
        
        // Notify parent Room page so it updates the DB metadata state array
        onFileLogged?.(fileMeta);
        
        // Reset file input element
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    readNextChunk();
  };

  // ----------------------------------------------------------------
  // P2P RECEIVER: Reassembles incoming binary buffers
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!dataChannel) return;

    // Explicitly enforce arraybuffer binary type to support reliable cross-browser binary file chunks
    dataChannel.binaryType = "arraybuffer";

    let receivedChunks = [];
    let activeFileInfo = null;
    let receivedSize = 0;

    const handleMessage = (event) => {
      // Case A: Incoming chunk is binary (ArrayBuffer)
      if (event.data instanceof ArrayBuffer) {
        receivedChunks.push(event.data);
        receivedSize += event.data.byteLength;

        if (activeFileInfo) {
          const progress = Math.round((receivedSize / activeFileInfo.size) * 100);
          setTransferProgress({ name: activeFileInfo.name, progress, type: "receiving" });
        }
        return;
      }

      // Case B: Incoming chunk is text (JSON signaling packet)
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "file-meta") {
          // Initialize incoming buffer
          receivedChunks = [];
          receivedSize = 0;
          activeFileInfo = {
            name: payload.fileName,
            size: payload.fileSize,
            type: payload.fileType,
            senderRole: payload.senderRole
          };
          setTransferProgress({ name: payload.fileName, progress: 0, type: "receiving" });
          toast(`Incoming file: ${payload.fileName}`, { icon: "📁" });
        } 
        else if (payload.type === "file-end" && activeFileInfo) {
          // Compile chunks into a single binary Blob and generate a download link
          const fileBlob = new Blob(receivedChunks, { type: activeFileInfo.type });
          const downloadUrl = URL.createObjectURL(fileBlob);

          const completedFile = {
            fileName: activeFileInfo.name,
            fileSize: activeFileInfo.size,
            fileType: activeFileInfo.type,
            senderRole: activeFileInfo.senderRole,
            downloadUrl
          };

          setSharedFiles((prev) => [...prev, completedFile]);
          setTransferProgress(null);
          toast.success(`File received: ${activeFileInfo.name}`);
          
          // Notify parent Room page to update DB metadata logging state array
          onFileLogged?.({
            fileName: activeFileInfo.name,
            fileSize: activeFileInfo.size,
            fileType: activeFileInfo.type,
            senderRole: activeFileInfo.senderRole
          });

          // Reset buffers
          receivedChunks = [];
          activeFileInfo = null;
          receivedSize = 0;
        }
      } catch (err) {
         // Ignore non-json binary or chat packets
      }
    };

    dataChannel.addEventListener("message", handleMessage);
    return () => {
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [dataChannel, onFileLogged]);

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      sharedFiles.forEach(file => {
        if (file.downloadUrl) URL.revokeObjectURL(file.downloadUrl);
      });
    };
  }, [sharedFiles]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 select-none flex justify-between items-center shrink-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Session Workspace
        </p>
      </div>

      {/* Real-Time File Transfer Progress Overlay */}
      {transferProgress && (
        <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/50 animate-fadeIn">
          <p className="text-xs font-semibold text-slate-600 truncate mb-1">
            {transferProgress.type === "sending" ? "Uploading" : "Downloading"}: {transferProgress.name}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-100" 
                style={{ width: `${transferProgress.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 font-mono select-none">{transferProgress.progress}%</span>
          </div>
        </div>
      )}

      {/* Render Shared Files Panel (if any exist) */}
      {sharedFiles.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 max-h-40 overflow-y-auto space-y-2 shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Transferred Files</p>
          {sharedFiles.map((file, i) => (
            <div key={i} className="flex items-center justify-between gap-3 bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.fileName}</p>
                <p className="text-[10px] text-slate-400 font-bold font-mono">
                  {Math.round(file.fileSize / 1024)} KB · {file.senderRole === "agent" ? "By Agent" : "By Client"}
                </p>
              </div>
              {file.downloadUrl && (
                <a 
                  href={file.downloadUrl} 
                  download={file.fileName}
                  className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable chat viewport */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400 font-medium px-4 select-none">
            No messages yet. Send a P2P message below.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug wrap-break-word ${
                msg.sender === "self"
                  ? "bg-blue-600 text-white self-end rounded-tr-none"
                  : "bg-slate-100 text-slate-800 self-start rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Form Input footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0 select-none">
        <form onSubmit={onSendMessage} className="flex gap-2">
          {/* File selector input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={!isDataChannelOpen}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!isDataChannelOpen || transferProgress}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full active:scale-95 transition-all focus:outline-none disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isDataChannelOpen ? "Type a secure P2P message..." : "Waiting for connection..."}
            disabled={!isDataChannelOpen}
            className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={!isDataChannelOpen || !chatInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white p-2.5 rounded-full active:scale-95 transition-all focus:outline-none"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}