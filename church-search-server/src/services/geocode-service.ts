import { Client, LatLngLiteral } from "@googlemaps/google-maps-services-js";
import { Response } from "express";

const mapsClient = new Client({});

enum GeocodeResult {
    SUCCESS,
    ADDRESS_NOT_FOUND,
    ERROR
};

/**
 * Uses Google API to retrieve the geocode location (lat / lng) of a given
 * address. Returns both the result status, and the location if successful.
 * @param church The church whose address is being converted.
 * @returns An object with the result value, and LatLng location.
 */
const getGeocodeLocation = async (church: any, res: Response): Promise<LatLngLiteral | null> => {

    if(!process.env.GEOCODE_API_KEY)
        throw new GeocodeApiKeyNotDefinedError();

    const geoRes = await mapsClient.geocode({
        params: {
            key: process.env.GEOCODE_API_KEY,
            address: `${church.address}, ${church.city}, ${church.state}, ${church.zipCode}`,
        }
    });

    if (geoRes.data.status.includes("ZERO_RESULTS")) 
        return null;
    if (!geoRes.data.status.includes("OK")) 
        throw new GeocodeApiError();
 
    const loc = geoRes.data.results[0].geometry.location;
    return loc;
}

class GeocodeApiKeyNotDefinedError extends Error { }
class GeocodeApiError extends Error { }

export {
    GeocodeResult,
    getGeocodeLocation
}