from abc import ABC, abstractmethod
from typing import Optional


class StorageAdapter(ABC):
    """
    Abstract base class for storage adapters.
    Provides interface for saving QR codes and signatures (firmas) to different storage backends.
    """
    
    @abstractmethod
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str, created_by: str = "") -> str:
        """
        Save QR code image to storage.
        
        Args:
            qr_image_bytes: QR code image as bytes
            nombre: Name for the session (used in filename)
            fecha: Date string (used in filename)
            created_by: Email of the creator (used for folder organization)
            
        Returns:
            URL or path to access the saved QR code
            
        Folder structure: QRS/{created_by}/{nombre}/qr_{timestamp}.png
        """
        pass
    

    @abstractmethod
    def delete_qr(self, filename: str) -> bool:
        """
        Delete QR code from storage.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        pass
    

    @abstractmethod
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access a QR code.
        
        Args:
            filename: Name of the QR file
            
        Returns:
            URL or path to access the QR code
        """
        pass
    
