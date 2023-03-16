import { existsSync, unlink } from 'fs';
import { resolve } from 'path';

export function deleteImageFromUploads(filename = 'test.jpg') {
  const imagePath = resolve(`uploads/${filename}`);
  if (existsSync(imagePath)) {
    unlink(imagePath, (err) => {
      if (err) console.error(err);
    });
  }
}
