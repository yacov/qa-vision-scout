import { Response, RequestInfo, RequestInit } from 'node-fetch';
import { Mock } from 'jest-mock';

declare global {
  function fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
  namespace NodeJS {
    interface Global {
      fetch: Mock<Promise<Response>, [RequestInfo, (RequestInit | undefined)?]>;
    }
  }
} 