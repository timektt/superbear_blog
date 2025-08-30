import { FileValidator, FILE_VALIDATION_CONFIG } from '@/lib/media/file-validator';

// Mock browser APIs
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsArrayBuffer(file: File | Blob) {
    setTimeout(() => {
      // Mock different file signatures based on file type
      let buffer: ArrayBuffer;
      
      if (file instanceof File) {
        if (file.type === 'image/jpeg') {
          // JPEG signature: FF D8 FF
          buffer = new ArrayBuffer(16);
          const view = new Uint8Array(buffer);
          view[0] = 0xFF;
          view[1] = 0xD8;
          view[2] = 0xFF;
          view[3] = 0xE0;
        } else if (file.type === 'image/png') {
          // PNG signature: 89 50 4E 47 0D 0A 1A 0A
          buffer = new ArrayBuffer(16);
          const view = new Uint8Array(buffer);
          view[0] = 0x89;
          view[1] = 0x50;
          view[2] = 0x4E;
          view[3] = 0x47;
          view[4] = 0x0D;
          view[5] = 0x0A;
          view[6] = 0x1A;
          view[7] = 0x0A;
        } else {
          // Invalid signature
          buffer = new ArrayBuffer(16);
          const view = new Uint8Array(buffer);
          view[0] = 0x00;
          view[1] = 0x00;
          view[2] = 0x00;
          view[3] = 0x00;
        }
      } else {
        buffer = new ArrayBuffer(16);
      }
      
      this.result = buffer;
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 10);
  }
} as any;

global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 800;
  height: number = 600;

  set src(value: string) {
    setTimeout(() => {
      if (value.includes('invalid')) {
        if (this.onerror) this.onerror();
      } else {
        if (this.onload) this.onload();
      }
    }, 10);
  }
} as any;

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

global.document = {
  createElement: jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toBlob: jest.fn((callback) => {
          const mockBlob = new Blob(['mock'], { type: 'image/jpeg' });
          callback(mockBlob);
        }),
      };
    }
    return {};
  }),
} as any;

describe('FileValidator', () => {
  let fileValidator: FileValidator;

  beforeEach(() => {
    fileValidator = new FileValidator();
    jest.clearAllMocks();
  });

  const createMockFile = (
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024,
    content: string = 'mock content'
  ): File => {
    const file = new File([content], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  describe('validateFile', () => {
    it('should validate a valid JPEG file', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.mimeType).toBe('image/jpeg');
      expect(result.metadata?.size).toBe(1024);
    });

    it('should validate a valid PNG file', async () => {
      const file = createMockFile('test.png', 'image/png', 2048);

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.mimeType).toBe('image/png');
    });

    it('should reject files that are too large', async () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 20 * 1024 * 1024); // 20MB

      const result = await fileValidator.validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB limit
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('exceeds maximum allowed size')
      );
    });

    it('should reject files that are too small', async () => {
      const file = createMockFile('tiny.jpg', 'image/jpeg', 50); // 50 bytes

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('below minimum required size')
      );
    });

    it('should reject empty files', async () => {
      const file = createMockFile('empty.jpg', 'image/jpeg', 0);

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should reject disallowed MIME types', async () => {
      const file = createMockFile('document.pdf', 'application/pdf', 1024);

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('File type \'application/pdf\' is not allowed')
      );
    });

    it('should validate custom allowed types', async () => {
      const file = createMockFile('test.gif', 'image/gif', 1024);

      const result = await fileValidator.validateFile(file, {
        allowedTypes: ['image/gif', 'image/png'],
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject files with invalid headers', async () => {
      const file = createMockFile('fake.jpg', 'image/jpeg', 1024);
      
      // Mock FileReader to return invalid header
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        result: ArrayBuffer | null = null;
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        
        readAsArrayBuffer() {
          setTimeout(() => {
            const buffer = new ArrayBuffer(16);
            const view = new Uint8Array(buffer);
            // Invalid JPEG header
            view[0] = 0x00;
            view[1] = 0x00;
            view[2] = 0x00;
            view[3] = 0x00;
            this.result = buffer;
            if (this.onload) this.onload({} as ProgressEvent<FileReader>);
          }, 10);
        }
      } as any;

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('File header does not match expected signature')
      );

      global.FileReader = originalFileReader;
    });

    it('should validate image dimensions', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file, {
        maxWidth: 1000,
        maxHeight: 1000,
      });

      expect(result.metadata?.width).toBe(800);
      expect(result.metadata?.height).toBe(600);
      expect(result.isValid).toBe(true);
    });

    it('should reject images that are too large in dimensions', async () => {
      const file = createMockFile('huge.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file, {
        maxWidth: 500,
        maxHeight: 500,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Image width 800px exceeds maximum allowed width of 500px')
      );
      expect(result.errors).toContain(
        expect.stringContaining('Image height 600px exceeds maximum allowed height of 500px')
      );
    });

    it('should strip EXIF data from JPEG files', async () => {
      const file = createMockFile('with-exif.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file, {
        stripExif: true,
      });

      expect(result.processedFile).toBeDefined();
      expect(result.metadata?.hasExifData).toBe(true);
      expect(result.metadata?.strippedExifTags).toContain('All EXIF data stripped');
    });

    it('should skip EXIF stripping when disabled', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file, {
        stripExif: false,
      });

      expect(result.processedFile).toBeUndefined();
    });

    it('should perform malware scanning when enabled', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file, {
        performMalwareScan: true,
      });

      expect(result.warnings).toContain(
        expect.stringContaining('Basic malware scan completed')
      );
    });

    it('should detect suspicious content in malware scan', async () => {
      // Create a file with suspicious content
      const suspiciousContent = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // MZ header
      const file = new File([suspiciousContent], 'suspicious.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: suspiciousContent.length });

      const result = await fileValidator.validateFile(file, {
        performMalwareScan: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'File contains suspicious content that may indicate malware'
      );
    });
  });

  describe('filename validation', () => {
    it('should reject dangerous filename patterns', async () => {
      const dangerousFiles = [
        'script.php',
        'malware.exe',
        'virus.bat',
        'trojan.scr',
        'bad.jsp',
      ];

      for (const filename of dangerousFiles) {
        const file = createMockFile(filename, 'image/jpeg', 1024);
        const result = await fileValidator.validateFile(file);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          expect.stringContaining('Filename contains potentially dangerous pattern')
        );
      }
    });

    it('should reject filenames with path traversal attempts', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config',
        'normal/../../../secret.txt',
      ];

      for (const filename of maliciousFilenames) {
        const file = createMockFile(filename, 'image/jpeg', 1024);
        const result = await fileValidator.validateFile(file);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Filename contains invalid path characters');
      }
    });

    it('should reject filenames with null bytes', async () => {
      const file = createMockFile('test\0.jpg', 'image/jpeg', 1024);
      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename contains null bytes');
    });

    it('should reject very long filenames', async () => {
      const longFilename = 'a'.repeat(300) + '.jpg';
      const file = createMockFile(longFilename, 'image/jpeg', 1024);
      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename is too long (maximum 255 characters)');
    });

    it('should reject empty filenames', async () => {
      const file = createMockFile('', 'image/jpeg', 1024);
      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename cannot be empty');
    });

    it('should reject whitespace-only filenames', async () => {
      const file = createMockFile('   ', 'image/jpeg', 1024);
      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename cannot be empty');
    });
  });

  describe('error handling', () => {
    it('should handle file reading errors gracefully', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      // Mock FileReader to fail
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
        
        readAsArrayBuffer() {
          setTimeout(() => {
            if (this.onerror) this.onerror({} as ProgressEvent<FileReader>);
          }, 10);
        }
      } as any;

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Failed to read file header')
      );

      global.FileReader = originalFileReader;
    });

    it('should handle image loading errors gracefully', async () => {
      const file = createMockFile('invalid.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file);

      expect(result.warnings).toContain(
        expect.stringContaining('Could not determine image dimensions')
      );
    });

    it('should handle EXIF stripping errors gracefully', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      // Mock Image to fail
      const originalImage = global.Image;
      global.Image = class {
        onerror: (() => void) | null = null;
        
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 10);
        }
      } as any;

      const result = await fileValidator.validateFile(file, {
        stripExif: true,
      });

      expect(result.warnings).toContain(
        expect.stringContaining('Could not strip EXIF data')
      );

      global.Image = originalImage;
    });

    it('should handle validation exceptions', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      // Mock FileReader to throw an exception
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsArrayBuffer() {
          throw new Error('FileReader exception');
        }
      } as any;

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Validation failed: FileReader exception')
      );

      global.FileReader = originalFileReader;
    });
  });

  describe('configuration validation', () => {
    it('should use default configuration values', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const result = await fileValidator.validateFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should respect custom validation options', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5 * 1024 * 1024); // 5MB

      const result = await fileValidator.validateFile(file, {
        maxSize: 1 * 1024 * 1024, // 1MB limit
        maxWidth: 1000,
        maxHeight: 1000,
        allowedTypes: ['image/jpeg'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('exceeds maximum allowed size')
      );
    });
  });

  describe('FILE_VALIDATION_CONFIG', () => {
    it('should have correct MIME type mappings', () => {
      expect(FILE_VALIDATION_CONFIG.ALLOWED_TYPES['image/jpeg']).toEqual([0xFF, 0xD8, 0xFF]);
      expect(FILE_VALIDATION_CONFIG.ALLOWED_TYPES['image/png']).toEqual([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    });

    it('should have reasonable size limits', () => {
      expect(FILE_VALIDATION_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(FILE_VALIDATION_CONFIG.MIN_FILE_SIZE).toBe(100); // 100 bytes
    });

    it('should have reasonable dimension limits', () => {
      expect(FILE_VALIDATION_CONFIG.MAX_WIDTH).toBe(8000);
      expect(FILE_VALIDATION_CONFIG.MAX_HEIGHT).toBe(8000);
      expect(FILE_VALIDATION_CONFIG.MIN_WIDTH).toBe(10);
      expect(FILE_VALIDATION_CONFIG.MIN_HEIGHT).toBe(10);
    });

    it('should include dangerous patterns', () => {
      expect(FILE_VALIDATION_CONFIG.DANGEROUS_PATTERNS).toContain(/\.php$/i);
      expect(FILE_VALIDATION_CONFIG.DANGEROUS_PATTERNS).toContain(/\.exe$/i);
      expect(FILE_VALIDATION_CONFIG.DANGEROUS_PATTERNS).toContain(/<script/i);
    });

    it('should include sensitive EXIF tags', () => {
      expect(FILE_VALIDATION_CONFIG.SENSITIVE_EXIF_TAGS).toContain('GPS');
      expect(FILE_VALIDATION_CONFIG.SENSITIVE_EXIF_TAGS).toContain('DateTime');
      expect(FILE_VALIDATION_CONFIG.SENSITIVE_EXIF_TAGS).toContain('UserComment');
    });
  });
});