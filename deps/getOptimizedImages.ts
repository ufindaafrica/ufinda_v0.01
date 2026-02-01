

export const cdnImage = (url: string, width: number) =>
  url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);

export const cdnVideo = (url: string, width: number) =>
  url.replace("/upload/", `/upload/f_mp4,vc_h264,q_auto,w_${width}/`);
