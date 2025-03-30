import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';

export default function CSVUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      await uploadFile(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiRequest('POST', '/api/products/import', formData);
      toast({
        title: 'Success',
        description: 'Products imported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import products',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card
      className={`p-6 mb-6 border-2 border-dashed ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload">
          <div className="cursor-pointer">
            <span className="material-icons text-4xl mb-2">upload_file</span>
            <p className="text-sm text-gray-600">
              Drag and drop a CSV file here, or click to select
            </p>
          </div>
        </label>
      </div>
    </Card>
  );
}