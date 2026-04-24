import React, { useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import { PROGRESS_INTERVAL_MS, PROGRESS_INCREMENT, REDIRECT_DELAY_MS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/constants';

interface UploadProps {
    onComplete?: (data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const readerRef = useRef<FileReader | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const clearTimers = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return "Invalid file type. Please upload a JPG or PNG image.";
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return "File is too large. Maximum size is 50MB.";
        }
        return null;
    };

    const processFile = useCallback((file: File) => {
        if (!isSignedIn) return;

        setError(null);
        setFile(file);
        setProgress(0);
        clearTimers();

        const reader = new FileReader();
        readerRef.current = reader;

        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") return;
            
            const base64Data = result;

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + PROGRESS_INCREMENT;
                    if (next >= 100) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        intervalRef.current = null;
                        
                        timeoutRef.current = setTimeout(() => {
                            onComplete?.(base64Data);
                            timeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.onerror = () => {
            clearTimers();
            setFile(null);
            setProgress(0);
        };

        reader.onabort = () => {
            clearTimers();
            setFile(null);
            setProgress(0);
        };

        reader.readAsDataURL(file);
    }, [isSignedIn, onComplete, clearTimers]);

    React.useEffect(() => {
        return () => {
            clearTimers();
            if (readerRef.current) {
                readerRef.current.abort();
            }
        };
    }, [clearTimers]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const validationError = validateFile(droppedFile);
            if (validationError) {
                setError(validationError);
                return;
            }
            processFile(droppedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validationError = validateFile(selectedFile);
            if (validationError) {
                setError(validationError);
                return;
            }
            processFile(selectedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg, .jpeg, .png"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20}/>
                        </div>
                        <p>
                            {isSignedIn? (
                                "Drag and drop your image here or click to upload"
                            ) : (
                                "Please sign in or sign up with Puter to upload images"
                            )}
                        </p>
                        <p className="help">Maximum File Size: 50MB.</p>
                        {error && <p className="error-message" style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>
                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }}></div>
                        
                            <p className="status-text">
                                {progress < 100 ? `Analyzing Floor Plan... ${progress}%` : "Redirecting..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;