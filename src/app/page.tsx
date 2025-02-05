'use client';

import { useState } from 'react';
import { auth, db, storage } from '@/config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

export default function Home() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    try {
      setIsLoading(true);
      const result = await signInAnonymously(auth);
      setTestResult(`Auth Success! User ID: ${result.user.uid}`);
    } catch (error) {
      setTestResult(`Auth Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirestore = async () => {
    try {
      setIsLoading(true);
      // Write a test document
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello from emulator!',
        timestamp: new Date().toISOString()
      });
      
      // Read all test documents
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setTestResult(`Firestore Success! Written doc ID: ${docRef.id}, Total docs: ${docs.length}`);
    } catch (error) {
      setTestResult(`Firestore Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStorage = async () => {
    try {
      setIsLoading(true);
      const testBlob = new Blob(['Hello, Storage!'], { type: 'text/plain' });
      const storageRef = ref(storage, 'test/hello.txt');
      await uploadBytes(storageRef, testBlob);
      setTestResult('Storage Success! File uploaded');
    } catch (error) {
      setTestResult(`Storage Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Firebase Emulator Test</h1>
      
      <div className="space-y-6">
        <div>
          <button
            onClick={testAuth}
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Test Auth
          </button>
        </div>

        <div>
          <button
            onClick={testFirestore}
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Test Firestore
          </button>
        </div>

        <div>
          <button
            onClick={testStorage}
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Test Storage
          </button>
        </div>

        {testResult && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </main>
  );
} 