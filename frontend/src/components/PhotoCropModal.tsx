import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface PhotoCropModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => Promise<void> | void;
  onCancel: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load image for cropping.')));
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, cropPixels: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not initialize canvas context.');
  }

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not generate cropped image.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      0.9
    );
  });
}

export default function PhotoCropModal({ imageSrc, onConfirm, onCancel }: PhotoCropModalProps): JSX.Element {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasCroppedArea = useMemo(() => croppedAreaPixels !== null, [croppedAreaPixels]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = modalRef.current;
    if (!container) {
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const firstFocusable = focusableElements[0];
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSubmitting) {
          onCancel();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const updatedFocusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (updatedFocusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = updatedFocusable[0];
      const last = updatedFocusable[updatedFocusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSubmitting, onCancel]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await Promise.resolve(onConfirm(blob));
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Could not prepare the cropped image.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crop-modal-overlay" role="presentation">
      <div
        ref={modalRef}
        className="crop-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Crop profile photo"
      >
        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="crop-controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              disabled={isSubmitting}
            />
          </label>

          {errorMessage ? <p className="message error">{errorMessage}</p> : null}

          <div className="photo-actions">
            <button type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleConfirm}
              disabled={isSubmitting || !hasCroppedArea}
            >
              {isSubmitting ? 'Applying...' : 'Apply & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
