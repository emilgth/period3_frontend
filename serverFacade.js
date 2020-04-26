
import { SERVER_URL } from "./settings";

const ServerFacade = () => {

  async function fetchGameArea() {
    const res = await fetch(`${SERVER_URL}/api/geoapi/gamearea`).then(res => res.json());
    return res.coordinates;
  }

  async function isUserInArea(lon, lat) {
    const status = await fetch(`${SERVER_URL}/api/geoapi/isuserinarea/${lon}/${lat}`).
                    then(res => res.json())
    return status;
  }

  return {
    fetchGameArea,
    isUserInArea
  }
}

export default ServerFacade();
