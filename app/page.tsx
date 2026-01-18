"use client";

import React, { useState, useRef, useCallback } from "react";

type CubeFace = "top" | "left" | "front" | "right" | "back" | "bottom";
type ExportFormat = "cross" | "cross-vertical" | "strip-horizontal" | "strip-vertical" | "grid-3x2" | "grid-2x3";

interface FaceSlot {
  face: CubeFace;
  image: string | null;
}

interface FormatConfig {
  name: string;
  width: number; // in face units
  height: number; // in face units
  positions: Record<CubeFace, { x: number; y: number }>;
}

const EXPORT_FORMATS: Record<ExportFormat, FormatConfig> = {
  cross: {
    name: "Cross (Horizontal)",
    width: 4,
    height: 3,
    positions: {
      top: { x: 1, y: 0 },
      left: { x: 0, y: 1 },
      front: { x: 1, y: 1 },
      right: { x: 2, y: 1 },
      back: { x: 3, y: 1 },
      bottom: { x: 1, y: 2 },
    },
  },
  "cross-vertical": {
    name: "Cross (Vertical)",
    width: 3,
    height: 4,
    positions: {
      top: { x: 1, y: 0 },
      left: { x: 0, y: 1 },
      front: { x: 1, y: 1 },
      right: { x: 2, y: 1 },
      bottom: { x: 1, y: 2 },
      back: { x: 1, y: 3 },
    },
  },
  "strip-horizontal": {
    name: "Strip (Horizontal)",
    width: 6,
    height: 1,
    positions: {
      right: { x: 0, y: 0 },
      left: { x: 1, y: 0 },
      top: { x: 2, y: 0 },
      bottom: { x: 3, y: 0 },
      front: { x: 4, y: 0 },
      back: { x: 5, y: 0 },
    },
  },
  "strip-vertical": {
    name: "Strip (Vertical)",
    width: 1,
    height: 6,
    positions: {
      right: { x: 0, y: 0 },
      left: { x: 0, y: 1 },
      top: { x: 0, y: 2 },
      bottom: { x: 0, y: 3 },
      front: { x: 0, y: 4 },
      back: { x: 0, y: 5 },
    },
  },
  "grid-3x2": {
    name: "Grid (3×2)",
    width: 3,
    height: 2,
    positions: {
      right: { x: 0, y: 0 },
      left: { x: 1, y: 0 },
      top: { x: 2, y: 0 },
      bottom: { x: 0, y: 1 },
      front: { x: 1, y: 1 },
      back: { x: 2, y: 1 },
    },
  },
  "grid-2x3": {
    name: "Grid (2×3)",
    width: 2,
    height: 3,
    positions: {
      right: { x: 0, y: 0 },
      left: { x: 1, y: 0 },
      top: { x: 0, y: 1 },
      bottom: { x: 1, y: 1 },
      front: { x: 0, y: 2 },
      back: { x: 1, y: 2 },
    },
  },
};

const INITIAL_SLOTS: FaceSlot[] = [
  { face: "top", image: null },
  { face: "left", image: null },
  { face: "front", image: null },
  { face: "right", image: null },
  { face: "back", image: null },
  { face: "bottom", image: null },
];

// Convert x,y position to CSS grid-area (1-indexed)
function getGridArea(pos: { x: number; y: number }): string {
  const row = pos.y + 1;
  const col = pos.x + 1;
  return `${row} / ${col} / ${row + 1} / ${col + 1}`;
}

const FACE_LABELS: Record<CubeFace, string> = {
  top: "Top",
  left: "Left",
  front: "Front",
  right: "Right",
  back: "Back",
  bottom: "Bottom",
};

// Maps common cubemap naming conventions to our face names
function detectFaceFromFilename(filename: string): CubeFace | null {
  const name = filename.toLowerCase().replace(/\.[^.]+$/, ""); // Remove extension
  
  // Check for common patterns - order matters, check more specific patterns first
  const patterns: { regex: RegExp; face: CubeFace }[] = [
    // pos/neg variations: posx, pos_x, pos-x, positivex
    { regex: /(?:^|[_\-\s])pos(?:itive)?[_\-\s]?x(?:[_\-\s]|$)/i, face: "right" },
    { regex: /(?:^|[_\-\s])neg(?:ative)?[_\-\s]?x(?:[_\-\s]|$)/i, face: "left" },
    { regex: /(?:^|[_\-\s])pos(?:itive)?[_\-\s]?y(?:[_\-\s]|$)/i, face: "top" },
    { regex: /(?:^|[_\-\s])neg(?:ative)?[_\-\s]?y(?:[_\-\s]|$)/i, face: "bottom" },
    { regex: /(?:^|[_\-\s])pos(?:itive)?[_\-\s]?z(?:[_\-\s]|$)/i, face: "front" },
    { regex: /(?:^|[_\-\s])neg(?:ative)?[_\-\s]?z(?:[_\-\s]|$)/i, face: "back" },
    
    // px/nx shorthand variations
    { regex: /(?:^|[_\-\s])px(?:[_\-\s]|$)/i, face: "right" },
    { regex: /(?:^|[_\-\s])nx(?:[_\-\s]|$)/i, face: "left" },
    { regex: /(?:^|[_\-\s])py(?:[_\-\s]|$)/i, face: "top" },
    { regex: /(?:^|[_\-\s])ny(?:[_\-\s]|$)/i, face: "bottom" },
    { regex: /(?:^|[_\-\s])pz(?:[_\-\s]|$)/i, face: "front" },
    { regex: /(?:^|[_\-\s])nz(?:[_\-\s]|$)/i, face: "back" },
    
    // Directional names: right, left, top, bottom, front, back
    { regex: /(?:^|[_\-\s])right(?:[_\-\s]|$)/i, face: "right" },
    { regex: /(?:^|[_\-\s])left(?:[_\-\s]|$)/i, face: "left" },
    { regex: /(?:^|[_\-\s])(?:top|up)(?:[_\-\s]|$)/i, face: "top" },
    { regex: /(?:^|[_\-\s])(?:bottom|down)(?:[_\-\s]|$)/i, face: "bottom" },
    { regex: /(?:^|[_\-\s])(?:front|forward)(?:[_\-\s]|$)/i, face: "front" },
    { regex: /(?:^|[_\-\s])(?:back|backward)(?:[_\-\s]|$)/i, face: "back" },
    
    // Simple suffix/prefix: _x, _y, _z with +/-
    { regex: /\+x/i, face: "right" },
    { regex: /-x/i, face: "left" },
    { regex: /\+y/i, face: "top" },
    { regex: /-y/i, face: "bottom" },
    { regex: /\+z/i, face: "front" },
    { regex: /-z/i, face: "back" },
  ];
  
  for (const { regex, face } of patterns) {
    if (regex.test(name)) {
      return face;
    }
  }
  
  return null;
}

export default function Home() {
  const [slots, setSlots] = useState<FaceSlot[]>(INITIAL_SLOTS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("cross");
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartIndexRef = useRef<number | null>(null);
  const isDraggingTouch = useRef(false);

  const handleFileChange = useCallback(
    (index: number, file: File | null) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlots((prev) =>
          prev.map((slot, i) =>
            i === index ? { ...slot, image: e.target?.result as string } : slot
          )
        );
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleBulkUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).slice(0, 6);
    
    // Check if any files have recognizable face names
    const detectedMappings: { file: File; face: CubeFace | null }[] = fileArray.map(file => ({
      file,
      face: detectFaceFromFilename(file.name)
    }));
    
    const hasDetectedFaces = detectedMappings.some(m => m.face !== null);
    
    if (hasDetectedFaces) {
      // Use detected face names to place images
      detectedMappings.forEach(({ file, face }) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSlots((prev) => {
            if (face) {
              // Place in the detected face slot
              return prev.map((slot) =>
                slot.face === face
                  ? { ...slot, image: e.target?.result as string }
                  : slot
              );
            } else {
              // No face detected for this file, find first empty slot
              const emptyIndex = prev.findIndex((s) => !s.image);
              if (emptyIndex === -1) return prev;
              return prev.map((slot, i) =>
                i === emptyIndex
                  ? { ...slot, image: e.target?.result as string }
                  : slot
              );
            }
          });
        };
        reader.readAsDataURL(file);
      });
    } else {
      // No detected faces, use sequential placement (original behavior)
      fileArray.forEach((file, fileIndex) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSlots((prev) => {
            // Find the first empty slot or use fileIndex
            const emptyIndex = prev.findIndex((s, i) => !s.image && i >= fileIndex);
            const targetIndex = emptyIndex !== -1 ? emptyIndex : fileIndex;
            
            return prev.map((slot, i) =>
              i === targetIndex && !slot.image
                ? { ...slot, image: e.target?.result as string }
                : slot
            );
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!slots[index].image) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setIsDraggingFile(false);

    if (e.dataTransfer.files.length > 0) {
      handleFileChange(targetIndex, e.dataTransfer.files[0]);
      setDraggedIndex(null);
      return;
    }

    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      setSlots((prev) => {
        const newSlots = [...prev];
        const draggedImage = newSlots[draggedIndex].image;
        newSlots[draggedIndex] = {
          ...newSlots[draggedIndex],
          image: newSlots[targetIndex].image,
        };
        newSlots[targetIndex] = {
          ...newSlots[targetIndex],
          image: draggedImage,
        };
        return newSlots;
      });
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSlotClick = (index: number) => {
    // Don't trigger file input if we just finished a drag
    if (isDraggingTouch.current) {
      isDraggingTouch.current = false;
      return;
    }
    fileInputRefs.current[index]?.click();
  };

  // Touch event handlers - all native for iOS compatibility
  React.useEffect(() => {
    const findSlotIndex = (element: Element | null): number => {
      let slotElement = element as HTMLElement | null;
      while (slotElement && !slotElement.classList.contains('face-slot')) {
        slotElement = slotElement.parentElement as HTMLElement | null;
      }
      if (!slotElement) return -1;
      const allSlots = Array.from(document.querySelectorAll('.face-slot'));
      return allSlots.indexOf(slotElement);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const index = findSlotIndex(element);
      
      if (index === -1) return;
      
      // Check if this slot has an image by checking for the has-image class
      const slotElement = document.querySelectorAll('.face-slot')[index];
      if (!slotElement?.classList.contains('has-image')) return;
      
      // Prevent default to stop browser from scrolling or triggering click
      e.preventDefault();
      
      isDraggingTouch.current = false;
      touchStartIndexRef.current = index;
      setDraggedIndex(index);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startIndex = touchStartIndexRef.current;
      if (startIndex === null) return;
      
      isDraggingTouch.current = true;
      e.preventDefault();
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetIndex = findSlotIndex(element);
      
      if (targetIndex !== -1) {
        setDragOverIndex(targetIndex);
      } else {
        setDragOverIndex(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const startIndex = touchStartIndexRef.current;
      if (startIndex === null) return;

      // Get the element under the touch point
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetIndex = findSlotIndex(element);
      
      if (targetIndex !== -1 && isDraggingTouch.current && startIndex !== targetIndex) {
        setSlots((prev) => {
          const newSlots = [...prev];
          const draggedImage = newSlots[startIndex].image;
          newSlots[startIndex] = {
            ...newSlots[startIndex],
            image: newSlots[targetIndex].image,
          };
          newSlots[targetIndex] = {
            ...newSlots[targetIndex],
            image: draggedImage,
          };
          return newSlots;
        });
      }

      touchStartIndexRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
      
      // Reset drag flag after delay - must be longer than mobile click delay (~300ms)
      setTimeout(() => {
        isDraggingTouch.current = false;
      }, 350);
    };

    // Use native event listeners with passive: false for iOS compatibility
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files.length > 1) {
      handleBulkUpload(e.dataTransfer.files);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFile(true);
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  };

  const clearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, image: null } : slot))
    );
  };

  const clearAll = () => {
    setSlots(INITIAL_SLOTS);
  };

  const exportCubemap = useCallback(() => {
    const FACE_SIZE = 512;
    const format = EXPORT_FORMATS[exportFormat];
    const canvas = document.createElement("canvas");
    canvas.width = FACE_SIZE * format.width;
    canvas.height = FACE_SIZE * format.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let imagesLoaded = 0;
    const totalImages = slots.filter((s) => s.image).length;

    if (totalImages === 0) {
      alert("Please add at least one image before exporting.");
      return;
    }

    slots.forEach((slot) => {
      if (!slot.image) return;

      const img = new Image();
      img.onload = () => {
        const pos = format.positions[slot.face];
        ctx.drawImage(
          img,
          pos.x * FACE_SIZE,
          pos.y * FACE_SIZE,
          FACE_SIZE,
          FACE_SIZE
        );
        imagesLoaded++;

        if (imagesLoaded === totalImages) {
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `cubemap-${exportFormat}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }, "image/png");
        }
      };
      img.src = slot.image;
    });
  }, [slots, exportFormat]);

  const filledCount = slots.filter((s) => s.image).length;

  return (
    <div 
      className="main-container"
      onDrop={handleGlobalDrop}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
    >
      {isDraggingFile && (
        <div className="drop-overlay">
          <div className="drop-message">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Drop images to fill slots</span>
          </div>
        </div>
      )}

      <div className="app-layout">
        <div className="panel panel-left">
          <div className="cubemap-wrapper">
            <div 
              className="cubemap-grid"
              style={{
                gridTemplateColumns: `repeat(${EXPORT_FORMATS[exportFormat].width}, var(--slot-size))`,
                gridTemplateRows: `repeat(${EXPORT_FORMATS[exportFormat].height}, var(--slot-size))`,
              }}
            >
              {slots.map((slot, index) => (
                <div
                  key={slot.face}
                  ref={(el) => {
                    slotRefs.current[index] = el;
                  }}
                  className={`face-slot ${slot.image ? "has-image" : ""} ${draggedIndex === index ? "dragging" : ""} ${dragOverIndex === index ? "drag-over" : ""}`}
                  style={{ gridArea: getGridArea(EXPORT_FORMATS[exportFormat].positions[slot.face]) }}
                  draggable={!!slot.image}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSlotClick(index)}
                >
                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(index, e.target.files?.[0] || null)
                    }
                  />
                  {slot.image ? (
                    <>
                      <img
                        src={slot.image}
                        alt={FACE_LABELS[slot.face]}
                        draggable={false}
                      />
                      <button
                        className="remove-btn"
                        onClick={(e) => clearSlot(index, e)}
                        title="Remove image"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <span className="face-label">{FACE_LABELS[slot.face]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel panel-right">
          <header className="header">
            <h1>Cubemap Creator</h1>
            <p>Arrange 6 images and export in multiple formats</p>
          </header>

          <div className="controls">
            <div className="control-group">
              <label className="control-label">Upload Images</label>
              <input
                ref={bulkInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleBulkUpload(e.target.files)}
              />
              <button className="upload-btn" onClick={() => bulkInputRef.current?.click()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose Files
              </button>
              <span className="upload-hint">or drag & drop anywhere</span>
            </div>

            <div className="control-group">
              <label className="control-label">Layout Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="format-select"
              >
                {Object.entries(EXPORT_FORMATS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Export</label>
              <div className="actions">
                <button
                  onClick={clearAll}
                  disabled={filledCount === 0}
                  className="btn btn-secondary"
                >
                  Clear All
                </button>
                <button
                  onClick={exportCubemap}
                  disabled={filledCount === 0}
                  className="btn btn-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export PNG
                </button>
              </div>
            </div>

            <div className="status-bar">
              <span className="status-count">{filledCount}/6 faces filled</span>
            </div>
          </div>

          <footer className="footer">
            <span>Made by <a href="https://x.com/klattkev" target="_blank" rel="noopener noreferrer">Kevin Klatt</a></span>
          </footer>
        </div>
      </div>
    </div>
  );
}
