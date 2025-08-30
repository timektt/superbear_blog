import { z } from 'zod'

// File validation configuration
export const FILE_VALIDATION_CONFIG = {
  // Allowed MIME types with their magic number signatures
  ALLOWED_TYPES: {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
    'image/avif': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // AVIF signature
  } as const,
  
  // File size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 100, // 100 bytes
  
  // Image dimension limits
  MAX_WIDTH: 8000,
  MAX_HEIGHT: 8000,
  MIN_WIDTH: 10,
  MIN_HEIGHT: 10,
  
  // Security patterns to detect in filenames
  DANGEROUS_PATTERNS: [
    /\.php$/i,
    /\.jsp$/i,
    /\.asp$/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ],
  
  // EXIF tags to strip for privacy
  SENSITIVE_EXIF_TAGS: [
    'GPS', 'GPSInfo', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
    'GPSTimeStamp', 'GPSDateStamp', 'GPSProcessingMethod',
    'UserComment', 'ImageDescription', 'Artist', 'Copyright',
    'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
    'CameraOwnerName', 'BodySerialNumber', 'LensSerialNumber'
  ]
} as const

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    mimeType: string
    size: number
    width?: number
    height?: number
    hasExifData: boolean
    strippedExifTags: string[]
  }
  processedFile?: File
}

export interface ValidationOptions {
  maxSize?: number
  maxWidth?: number
  maxHeight?: number
  allowedTypes?: string[]
  stripExif?: boolean
  performMalwareScan?: boolean
}

export class FileValidator {
  /**
   * Comprehensive file validation with security checks
   */
  async validateFile(
    file: File, 
    options: ValidationOptions = {}
  ): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        mimeType: file.type,
        size: file.size,
        hasExifData: false,
        strippedExifTags: []
      }
    }

    try {
      // 1. Basic file checks
      await this.validateBasicProperties(file, result, options)
      
      // 2. File header validation (magic number check)
      await this.validateFileHeader(file, result)
      
      // 3. Filename security check
      this.validateFilename(file.name, result)
      
      // 4. Image dimension validation
      if (this.isImageFile(file.type)) {
        await this.validateImageDimensions(file, result, options)
      }
      
      // 5. EXIF data handling
      if (options.stripExif !== false && this.isImageFile(file.type)) {
        const processedFile = await this.stripExifData(file, result)
        if (processedFile) {
          result.processedFile = processedFile
        }
      }
      
      // 6. Malware scanning (if enabled)
      if (options.performMalwareScan) {
        await this.performMalwareScan(file, result)
      }
      
      // Set final validation status
      result.isValid = result.errors.length === 0
      
    } catch (error) {
      result.isValid = false
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Validate basic file properties
   */
  private async validateBasicProperties(
    file: File, 
    result: FileValidationResult, 
    options: ValidationOptions
  ): Promise<void> {
    const maxSize = options.maxSize || FILE_VALIDATION_CONFIG.MAX_FILE_SIZE
    const allowedTypes = options.allowedTypes || Object.keys(FILE_VALIDATION_CONFIG.ALLOWED_TYPES)

    // File size validation
    if (file.size > maxSize) {
      result.errors.push(`File size ${this.formatBytes(file.size)} exceeds maximum allowed size of ${this.formatBytes(maxSize)}`)
    }
    
    if (file.size < FILE_VALIDATION_CONFIG.MIN_FILE_SIZE) {
      result.errors.push(`File size ${this.formatBytes(file.size)} is below minimum required size of ${this.formatBytes(FILE_VALIDATION_CONFIG.MIN_FILE_SIZE)}`)
    }

    // MIME type validation
    if (!allowedTypes.includes(file.type)) {
      result.errors.push(`File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Empty file check
    if (file.size === 0) {
      result.errors.push('File is empty')
    }
  }

  /**
   * Validate file header against magic numbers
   */
  private async validateFileHeader(file: File, result: FileValidationResult): Promise<void> {
    try {
      const buffer = await this.readFileHeader(file, 16) // Read first 16 bytes
      const signature = FILE_VALIDATION_CONFIG.ALLOWED_TYPES[file.type as keyof typeof FILE_VALIDATION_CONFIG.ALLOWED_TYPES]
      
      if (!signature) {
        result.warnings.push(`No signature validation available for file type: ${file.type}`)
        return
      }

      // Check if file header matches expected signature
      const headerMatches = signature.every((byte, index) => buffer[index] === byte)
      
      if (!headerMatches) {
        result.errors.push(`File header does not match expected signature for ${file.type}. File may be corrupted or have incorrect extension.`)
      }
    } catch (error) {
      result.errors.push(`Failed to read file header: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate filename for security issues
   */
  private validateFilename(filename: string, result: FileValidationResult): void {
    // Check for dangerous patterns
    for (const pattern of FILE_VALIDATION_CONFIG.DANGEROUS_PATTERNS) {
      if (pattern.test(filename)) {
        result.errors.push(`Filename contains potentially dangerous pattern: ${filename}`)
        break
      }
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      result.errors.push('Filename contains invalid path characters')
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      result.errors.push('Filename contains null bytes')
    }

    // Check filename length
    if (filename.length > 255) {
      result.errors.push('Filename is too long (maximum 255 characters)')
    }

    // Check for empty or whitespace-only filename
    if (!filename.trim()) {
      result.errors.push('Filename cannot be empty')
    }
  }

  /**
   * Validate image dimensions
   */
  private async validateImageDimensions(
    file: File, 
    result: FileValidationResult, 
    options: ValidationOptions
  ): Promise<void> {
    try {
      const dimensions = await this.getImageDimensions(file)
      
      if (result.metadata) {
        result.metadata.width = dimensions.width
        result.metadata.height = dimensions.height
      }

      const maxWidth = options.maxWidth || FILE_VALIDATION_CONFIG.MAX_WIDTH
      const maxHeight = options.maxHeight || FILE_VALIDATION_CONFIG.MAX_HEIGHT

      if (dimensions.width > maxWidth) {
        result.errors.push(`Image width ${dimensions.width}px exceeds maximum allowed width of ${maxWidth}px`)
      }

      if (dimensions.height > maxHeight) {
        result.errors.push(`Image height ${dimensions.height}px exceeds maximum allowed height of ${maxHeight}px`)
      }

      if (dimensions.width < FILE_VALIDATION_CONFIG.MIN_WIDTH) {
        result.errors.push(`Image width ${dimensions.width}px is below minimum required width of ${FILE_VALIDATION_CONFIG.MIN_WIDTH}px`)
      }

      if (dimensions.height < FILE_VALIDATION_CONFIG.MIN_HEIGHT) {
        result.errors.push(`Image height ${dimensions.height}px is below minimum required height of ${FILE_VALIDATION_CONFIG.MIN_HEIGHT}px`)
      }

    } catch (error) {
      result.warnings.push(`Could not determine image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Strip EXIF data from images for privacy
   */
  private async stripExifData(file: File, result: FileValidationResult): Promise<File | null> {
    try {
      // For now, we'll use a simple approach that works with Canvas API
      // In production, you might want to use a more sophisticated EXIF library
      
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              
              canvas.toBlob((blob) => {
                if (blob) {
                  const strippedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                  })
                  
                  if (result.metadata) {
                    result.metadata.hasExifData = true
                    result.metadata.strippedExifTags = ['All EXIF data stripped']
                  }
                  
                  resolve(strippedFile)
                } else {
                  resolve(null)
                }
              }, file.type, 0.95)
            } else {
              resolve(null)
            }
          }
          
          img.onerror = () => resolve(null)
          img.src = URL.createObjectURL(file)
        })
      }
      
      return null
    } catch (error) {
      result.warnings.push(`Could not strip EXIF data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  /**
   * Perform malware scanning (placeholder for integration with security service)
   */
  private async performMalwareScan(file: File, result: FileValidationResult): Promise<void> {
    try {
      // This is a placeholder for malware scanning integration
      // In production, you would integrate with services like:
      // - ClamAV
      // - VirusTotal API
      // - AWS GuardDuty
      // - Custom security scanning service
      
      // For now, we'll do basic suspicious content detection
      const buffer = await file.arrayBuffer()
      const content = new Uint8Array(buffer)
      
      // Check for suspicious patterns in file content
      const suspiciousPatterns = [
        // Executable signatures
        [0x4D, 0x5A], // MZ header (Windows executable)
        [0x7F, 0x45, 0x4C, 0x46], // ELF header (Linux executable)
        // Script patterns in image files (polyglot attacks)
        [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], // <script
      ]
      
      for (const pattern of suspiciousPatterns) {
        if (this.containsPattern(content, pattern)) {
          result.errors.push('File contains suspicious content that may indicate malware')
          break
        }
      }
      
      result.warnings.push('Basic malware scan completed. For production use, integrate with professional security scanning service.')
      
    } catch (error) {
      result.warnings.push(`Malware scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Helper methods
   */
  private async readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    const slice = file.slice(0, bytes)
    const buffer = await slice.arrayBuffer()
    return new Uint8Array(buffer)
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private containsPattern(content: Uint8Array, pattern: number[]): boolean {
    for (let i = 0; i <= content.length - pattern.length; i++) {
      let match = true
      for (let j = 0; j < pattern.length; j++) {
        if (content[i + j] !== pattern[j]) {
          match = false
          break
        }
      }
      if (match) return true
    }
    return false
  }
}

// Validation schema for file validation options
export const fileValidationOptionsSchema = z.object({
  maxSize: z.number().positive().optional(),
  maxWidth: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
  allowedTypes: z.array(z.string()).optional(),
  stripExif: z.boolean().optional(),
  performMalwareScan: z.boolean().optional()
})

// Export singleton instance
export const fileValidator = new FileValidator()