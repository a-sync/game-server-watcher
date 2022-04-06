export default (seconds: any) => {
    const sec_num = Number(seconds);

    let hours: number | string = Math.floor(sec_num / 3600);
    let minutes: number | string = Math.floor((sec_num - (hours * 3600)) / 60);
    let secs: number | string = Math.floor(sec_num - (hours * 3600) - (minutes * 60));

    if (hours === 0) hours = '00';
    else if (hours < 10) hours = `0${hours}`;
    else hours = `${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    if (secs < 10) secs = `0${secs}`;
    return [hours, ':', minutes, ':', secs].join('');
}
