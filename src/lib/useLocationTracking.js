import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

function useLocationTracking(userId) {
    const [location, setLocation] = useState(null);
    const [placeName, setPlaceName] = useState("Location not available");

    useEffect(() => {
        if (!userId) return;

        const updateLocationInFirestore = async (latitude, longitude, placeName) => {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                location: {
                    latitude,
                    longitude,
                    placeName,
                },
            });
        };

        const getPlaceName = async (latitude, longitude) => {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                
                // Extract relevant parts of the address
                const address = data.address || {};
                const city = address.city || address.town || address.village || "Unknown City";
                const state = address.state || "Unknown State";
                const postalCode = address.postcode || "Unknown Postal Code";
                
                const place = `${city}, ${state} ${postalCode}`;
                setPlaceName(place);
                return place;
            } catch (error) {
                console.error("Error fetching place name:", error);
                return "Unknown Location";
            }
        };
        const handleLocationUpdate = async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            const placeName = await getPlaceName(latitude, longitude);
            updateLocationInFirestore(latitude, longitude, placeName);
        };

        const handleError = (error) => {
            console.error("Error getting location:", error);
        };

        const watchId = navigator.geolocation.watchPosition(handleLocationUpdate, handleError, {
            enableHighAccuracy: true,
        });

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [userId]);

    return { location, placeName };
}

export default useLocationTracking;
