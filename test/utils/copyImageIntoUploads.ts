import { copyFile } from 'fs';
import * as path from 'path';

export function copyImageIntoUploads() {
  const imagePath = path.resolve('test/static/test.jpg');
  const uploadsPath = path.resolve('uploads/test.jpg');

  copyFile(imagePath, uploadsPath, (err) => {
    if (err) console.error(err);
  });
}
