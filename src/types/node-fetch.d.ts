declare module 'node-fetch' {
  export default function fetch(
    url: string | Request,
    init?: RequestInit
  ): Promise<Response>;
} 