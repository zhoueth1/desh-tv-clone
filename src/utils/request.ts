import axios from 'axios';

export default axios.create({
  baseURL:
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000'
      : undefined,
});
