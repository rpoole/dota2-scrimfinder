importScripts('https://unpkg.com/axios/dist/axios.min.js');

const host = 'http://localhost:3000';

let stopRefresh = false;

self.addEventListener('message', (e) => {
    if (e.data.token) {
        stopRefresh = false;
        refreshToken(e.data.token);
    } else {
        stopRefresh = true;
    }

}, false);

function refreshToken(token) {
    if (stopRefresh) {
        return;
    }

    setTimeout(() => {
        axios
            .post(`${host}/renew_scrim_key`, {
                token: token,
            })
            .then( () => {
                refreshToken(token);
            });
    }, 240000);
}
