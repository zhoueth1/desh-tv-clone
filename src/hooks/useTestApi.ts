import request from '../utils/request';

export default function useTestApi() {
  return request
      .post('/api/apiTest')
      .then((data) => {
        console.log('API HAS BEEN TESTED', data);
      });
}
