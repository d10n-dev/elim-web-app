const GAS_URL = 'https://script.google.com/macros/s/AKfycbz0hPHjkMZvXbN-bX6M3DabagnisBvUDONLHBXelCuyIGexIKuGRS-JIfHUEMnkrHYo/exec';

function apiGet(action, params = {}) {
  params.action = action;
    const query = new URLSearchParams(params).toString();
      return fetch(`${GAS_URL}?${query}`)
          .then(res => res.json());
          }

          function apiPost(action, data = {}) {
            data.action = action;
              return fetch(GAS_URL, {
                  method: 'POST',
                      body: JSON.stringify(data)
                        }).then(res => res.json());
                        }