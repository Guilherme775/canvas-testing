import { getStroke } from 'perfect-freehand';

const getSvgPathFromStroke = (stroke) => {
    if (!stroke.length) return '';
  
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ['M', ...stroke[0], 'Q'],
    );
  
    d.push('Z');
    return d.join(' ');
};

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.webgl');
    const ctx = canvas.getContext('2d');

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;

    const green = 'rgba(0, 128, 0, 1)';
    const transparent_green = 'rgba(0, 128, 0, 0.5)';

    let painting = false;
    let currentTool = 'draw';
    let points = [];
    let startPoint = null;
    let lassoPath = new Path2D();

    const startPosition = (e) => {
        painting = true;
        const x = e.clientX - canvas.offsetLeft;
        const y = e.clientY - canvas.offsetTop;

        if (currentTool === 'rectangle' || currentTool === 'select') startPoint = { x, y };

        lassoPath = new Path2D();
        lassoPath.moveTo(e.offsetX, e.offsetY);
    }

    const endPosition = () => {
        painting = false;
        points = [];
        startPoint = null;
        lassoPath.closePath();
        
        if (currentTool === 'lasso') {
            ctx.fillStyle = transparent_green;
            ctx.fill(lassoPath);
        }
    }

    const draw = (e) => {
        if (!painting) return;

        const x = e.clientX - canvas.offsetLeft;
        const y = e.clientY - canvas.offsetTop;

        if (currentTool === 'draw') {
            points.push({ x, y });

            const stroke = getStroke(points, {
                size: 8,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
                easing: (t) => t,
                simulatePressure: true,
                last: true,
                start: {
                cap: true,
                taper: 0,
                easing: (t) => t,
                },
                end: {
                cap: true,
                taper: 0,
                easing: (t) => t,
                },
            });
            const path = new Path2D(getSvgPathFromStroke(stroke));

            ctx.fillStyle = green;
            ctx.fill(path);
        }

        if (currentTool === 'rectangle' && startPoint) {
            const width = x - startPoint.x;
            const height = y - startPoint.y;

            ctx.fillStyle = green;
            ctx.fillRect(startPoint.x, startPoint.y, width, height);
        }

        if (currentTool === 'select' && startPoint) {
            const width = x - startPoint.x;
            const height = y - startPoint.y;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = green;
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);

            ctx.fillStyle = transparent_green;
            ctx.fillRect(startPoint.x, startPoint.y, width, height);
        }

        if (currentTool === 'lasso') {
            lassoPath.lineTo(e.offsetX, e.offsetY);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = green;
            ctx.stroke(lassoPath);
        }
    }

    const selectTool = (tool) => {
        currentTool = tool;
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);

    document.getElementById('draw').addEventListener('click', () => selectTool('draw'));
    document.getElementById('rectangle').addEventListener('click', () => selectTool('rectangle'));
    document.getElementById('select').addEventListener('click', () => selectTool('select'));
    document.getElementById('lasso').addEventListener('click', () => selectTool('lasso'));
});