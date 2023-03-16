import { copyFile } from 'fs';
import { resolve } from 'path';

export function copyImageIntoUploads() {
  const imagePath = resolve('test/static/test.jpg');
  const uploadsPath = resolve('uploads/test.jpg');

  copyFile(imagePath, uploadsPath, (err) => {
    if (err) console.error(err);
  });
}
