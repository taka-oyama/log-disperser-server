window.socket = io.connect('http://localhost:3030');
_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };
