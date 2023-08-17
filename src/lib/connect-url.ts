export default function getConnectUrl(uri: string) {
    if (uri.indexOf('//') === -1) {
        return 'steam://connect/' + uri;
    }

    return uri;
}
