"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sec_num) => {
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let secs = Math.floor(sec_num - (hours * 3600) - (minutes * 60));
    if (hours === 0) {
        hours = '00';
    }
    else if (hours < 10) {
        hours = `0${hours}`;
    }
    else {
        hours = `${hours}`;
    }
    if (minutes < 10) {
        minutes = `0${minutes}`;
    }
    if (secs < 10) {
        secs = `0${secs}`;
    }
    return [hours, ':', minutes, ':', secs].join('');
};
