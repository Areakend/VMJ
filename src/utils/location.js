import { Geolocation } from '@capacitor/geolocation';

export const getCurrentLocation = async () => {
    try {
        // Request permissions first
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
            const request = await Geolocation.requestPermissions();
            if (request.location !== 'granted') {
                throw new Error('Location permission not granted');
            }
        }

        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
        });

        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
        };
    } catch (error) {
        console.error('Core Geolocation Error:', error);
        // Fallback to web geolocation if capacitor fails (e.g. running in browser)
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    });
                },
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
};
