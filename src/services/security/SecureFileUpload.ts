/**
 * Secure file upload service with comprehensive validation and processing
 * Implements file type validation, virus scanning simulation, and secure processing
 */

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFile?: File;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  originalName: string;
  sanitizedName: string;
  size: number;
  type: string;
  lastModified: number;
  checksum: string;
  isImage: boolean;
  dimensions?: { width: number; height: number };
}

export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  requireImageDimensions?: boolean;
  maxImageWidth?: number;
  maxImageHeight?: number;
  scanForMalware?: boolean;
}

export class SecureFileUploadService {
  private static instance: SecureFileUploadService;
  private readonly defaultConfig: UploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'text/plain', 'text/csv', 'text/markdown',
      'application/json', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.txt', '.csv', '.md',
      '.json', '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx'
    ],
    maxImageWidth: 4096,
    maxImageHeight: 4096,
    scanForMalware: true
  };

  public static getInstance(): SecureFileUploadService {
    if (!SecureFileUploadService.instance) {
      SecureFileUploadService.instance = new SecureFileUploadService();
    }
    return SecureFileUploadService.instance;
  }

  /**
   * Validate and process uploaded file
   */
  public async validateFile(file: File, config?: Partial<UploadConfig>): Promise<FileValidationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic file validation
      this.validateBasicProperties(file, finalConfig, result);
      
      if (!result.isValid) {
        return result;
      }

      // Generate file metadata
      result.metadata = await this.generateMetadata(file);

      // Validate file content
      await this.validateFileContent(file, finalConfig, result);

      // Scan for malware (simulated)
      if (finalConfig.scanForMalware) {
        await this.scanForMalware(file, result);
      }

      // Sanitize filename and create safe file
      if (result.isValid) {
        result.sanitizedFile = await this.sanitizeFile(file, result.metadata!);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate basic file properties
   */
  private validateBasicProperties(file: File, config: UploadConfig, result: FileValidationResult): void {
    // Check file size
    if (file.size > config.maxFileSize) {
      result.isValid = false;
      result.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(config.maxFileSize)})`);
    }

    if (file.size === 0) {
      result.isValid = false;
      result.errors.push('File is empty');
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type '${file.type}' is not allowed`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!config.allowedExtensions.includes(extension)) {
      result.isValid = false;
      result.errors.push(`File extension '${extension}' is not allowed`);
    }

    // Check for dangerous filename patterns
    if (this.hasDangerousFilename(file.name)) {
      result.isValid = false;
      result.errors.push('Filename contains potentially dangerous characters');
    }
  }

  /**
   * Generate comprehensive file metadata
   */
  private async generateMetadata(file: File): Promise<FileMetadata> {
    const checksum = await this.calculateChecksum(file);
    const sanitizedName = this.sanitizeFilename(file.name);
    const isImage = file.type.startsWith('image/');

    const metadata: FileMetadata = {
      originalName: file.name,
      sanitizedName,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      checksum,
      isImage
    };

    // Get image dimensions if it's an image
    if (isImage) {
      try {
        metadata.dimensions = await this.getImageDimensions(file);
      } catch (error) {
        console.warn('Could not get image dimensions:', error);
      }
    }

    return metadata;
  }

  /**
   * Validate file content based on type
   */
  private async validateFileContent(file: File, config: UploadConfig, result: FileValidationResult): Promise<void> {
    if (file.type.startsWith('image/')) {
      await this.validateImageContent(file, config, result);
    } else if (file.type === 'application/json') {
      await this.validateJsonContent(file, result);
    } else if (file.type.startsWith('text/')) {
      await this.validateTextContent(file, result);
    }
  }

  /**
   * Validate image file content
   */
  private async validateImageContent(file: File, config: UploadConfig, result: FileValidationResult): Promise<void> {
    try {
      const dimensions = await this.getImageDimensions(file);
      
      if (config.maxImageWidth && dimensions.width > config.maxImageWidth) {
        result.warnings.push(`Image width (${dimensions.width}px) exceeds recommended maximum (${config.maxImageWidth}px)`);
      }

      if (config.maxImageHeight && dimensions.height > config.maxImageHeight) {
        result.warnings.push(`Image height (${dimensions.height}px) exceeds recommended maximum (${config.maxImageHeight}px)`);
      }

      // Check for suspicious image properties
      if (dimensions.width * dimensions.height > 50000000) { // 50MP
        result.warnings.push('Image has very high resolution, consider resizing for better performance');
      }

    } catch (error) {
      result.errors.push('Invalid image file or corrupted image data');
    }
  }

  /**
   * Validate JSON file content
   */
  private async validateJsonContent(file: File, result: FileValidationResult): Promise<void> {
    try {
      const text = await file.text();
      JSON.parse(text);
      
      // Check for suspicious JSON content
      if (text.includes('<script') || text.includes('javascript:')) {
        result.warnings.push('JSON file contains potentially suspicious content');
      }
      
    } catch (error) {
      result.errors.push('Invalid JSON file format');
    }
  }

  /**
   * Validate text file content
   */
  private async validateTextContent(file: File, result: FileValidationResult): Promise<void> {
    try {
      const text = await file.text();
      
      // Check for binary content in text files
      if (this.containsBinaryContent(text)) {
        result.errors.push('Text file contains binary content');
      }

      // Check for suspicious content
      if (text.includes('<script') || text.includes('javascript:')) {
        result.warnings.push('Text file contains potentially suspicious content');
      }

    } catch (error) {
      result.errors.push('Could not read text file content');
    }
  }

  /**
   * Simulate malware scanning
   */
  private async scanForMalware(file: File, result: FileValidationResult): Promise<void> {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for known malicious patterns in filename
    const maliciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
      /\.com$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(file.name)) {
        result.isValid = false;
        result.errors.push('File type is potentially malicious');
        return;
      }
    }

    // Check file content for suspicious patterns
    if (file.size < 1024 * 1024) { // Only scan small files
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check for executable signatures
        if (this.hasExecutableSignature(bytes)) {
          result.isValid = false;
          result.errors.push('File contains executable code');
        }
      } catch (error) {
        result.warnings.push('Could not perform complete malware scan');
      }
    }
  }

  /**
   * Create sanitized version of the file
   */
  private async sanitizeFile(file: File, metadata: FileMetadata): Promise<File> {
    // Create new file with sanitized name
    const sanitizedFile = new File([file], metadata.sanitizedName, {
      type: file.type,
      lastModified: file.lastModified
    });

    return sanitizedFile;
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image'));
      };

      img.src = url;
    });
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    let sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
      .replace(/\.\./g, '_') // Remove directory traversal
      .replace(/^\./, '_') // Remove leading dot
      .trim();

    // Ensure filename is not empty
    if (!sanitized) {
      sanitized = 'unnamed_file';
    }

    // Limit filename length
    if (sanitized.length > 255) {
      const extension = this.getFileExtension(sanitized);
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
      sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
    }

    return sanitized;
  }

  /**
   * Check for dangerous filename patterns
   */
  private hasDangerousFilename(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./,           // Directory traversal
      /^CON$/i,         // Windows reserved names
      /^PRN$/i,
      /^AUX$/i,
      /^NUL$/i,
      /^COM[1-9]$/i,
      /^LPT[1-9]$/i,
      /[\x00-\x1f]/,    // Control characters
      /[<>:"/\\|?*]/    // Invalid filename characters
    ];

    return dangerousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
  }

  /**
   * Check if text contains binary content
   */
  private containsBinaryContent(text: string): boolean {
    // Check for null bytes and other binary indicators
    return /[\x00-\x08\x0E-\x1F\x7F]/.test(text);
  }

  /**
   * Check for executable file signatures
   */
  private hasExecutableSignature(bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;

    // Check for common executable signatures
    const signatures = [
      [0x4D, 0x5A], // PE executable (MZ)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O executable
      [0x50, 0x4B, 0x03, 0x04], // ZIP (could contain executables)
    ];

    return signatures.some(signature => {
      if (bytes.length < signature.length) return false;
      return signature.every((byte, index) => bytes[index] === byte);
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Process multiple files
   */
  public async validateFiles(files: FileList | File[], config?: Partial<UploadConfig>): Promise<FileValidationResult[]> {
    const fileArray = Array.from(files);
    
    if (fileArray.length > 10) {
      return [{
        isValid: false,
        errors: ['Too many files selected. Maximum 10 files allowed.'],
        warnings: []
      }];
    }

    const results = await Promise.all(
      fileArray.map(file => this.validateFile(file, config))
    );

    return results;
  }
}

export default SecureFileUploadService;