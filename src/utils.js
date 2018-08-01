export function roomNameFromXY (x, y) {
    if(x < 0) {
        x = 'W'+(-x-1);
    }
    else {
        x = 'E'+(x);
    }
    if(y < 0) {
        y = 'N'+(-y-1);
    }
    else {
        y = 'S'+(y);
    }
    return ""+x+y;
}

export function roomNameToXY (name) {
    var [match,hor,x,ver,y] = name.match(/^(\w)(\d+)(\w)(\d+)$/);
    if(hor == 'W') {
        x = -x-1;
    }
    else {
        x = +x;
        //x--;
    }
    if(ver == 'N') {
        y = -y-1;
    }
    else {
        y = +y;
        //y--;
    }
    return [x,y];
}