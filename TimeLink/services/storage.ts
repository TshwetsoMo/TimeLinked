// src/services/storage.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Helper function to convert a local file URI (from the image picker) to a Blob
 * that can be uploaded to Firebase Storage.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = (e) => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Uploads a user's profile image to Firebase Storage and returns the public URL.
 * @param userId The UID of the user.
 * @param uri The local URI of the image to upload.
 */
export async function uploadProfileImage(userId: string, uri: string): Promise<string> {
  try {
    const blob = await uriToBlob(uri);
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `profiles/${userId}/profile.jpg`);
    // Upload the file
    await uploadBytes(storageRef, blob);
    // Get the public URL of the uploaded file
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Image upload failed.");
  }
}