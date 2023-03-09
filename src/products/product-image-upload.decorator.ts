import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
} from '@nestjs/common';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_FILE_TYPES = /image\/(jpg|jpeg|png|webp)/;

export function UploadedProductImage() {
  return UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
      ],
    }),
  );
}
