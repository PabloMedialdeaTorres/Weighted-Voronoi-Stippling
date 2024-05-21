
let points = [];
let delaunay, voronoi;
let picture;
let pointsSlider, pointsValue, togglePolygonsButton, imageUpload;
let showPolygonsFlag = false;

function preload() {
  picture = loadImage('./assets/doggo.jpg');
}

function setup() {
  let canvas = createCanvas(picture.width, picture.height);

  canvas.id('myCanvas');

  pointsSlider = select('#pointsSlider');
  pointsValue = select('#pointsValue');
  togglePolygonsButton = select('#togglePolygonsButton');
  imageUpload = select('#imageUpload');

  pointsSlider.input(updatePointsFromSlider);
  togglePolygonsButton.mousePressed(togglePolygons);
  imageUpload.changed(handleImageUpload);

  togglePolygonsButton.html('Show Polygons');

  generateRandomPoints(pointsSlider.value());

  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function draw() {
  background(255);

  displayPoints();
  updatePoints();
}

function handleImageUpload(event) {
  let file = event.target.files[0];
  if (file) {
    let img = createImg(URL.createObjectURL(file), '', '', () => {
      picture = loadImage(URL.createObjectURL(file), () => {
        resizeCanvas(picture.width, picture.height);
        points = [];
        generateRandomPoints(pointsSlider.value());
        delaunay = calculateDelaunay(points);
        voronoi = delaunay.voronoi([0, 0, width, height]);
        redraw();
      });
    });
    img.hide();
  }
}



function updatePointsFromSlider() {
  pointsValue.html(pointsSlider.value());
  points = [];
  generateRandomPoints(pointsSlider.value());

  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);

  redraw();
}

function generateRandomPoints(n) {
  for (let i = 0; i < n; i++) {
    let x = random(width);
    let y = random(height);
    let col = picture.get(x, y);
    if (random(100) > brightness(col)) {
      points.push(createVector(x, y));
    } else {
      i--;
    }
  }
}

function displayPoints() {
  points.forEach(p => {
    stroke(0);
    strokeWeight(4);
    point(p.x, p.y);
  });
}

function showPolygons (cells) {
  for(let polygon of cells) {
    stroke(0);
    strokeWeight(1);
    noFill();
    beginShape();
    for(let i = 0; i < polygon.length; i++) {
      vertex(polygon[i][0], polygon[i][1]);
    }
    endShape();
  }
}

function togglePolygons() {
  showPolygonsFlag = !showPolygonsFlag;
  togglePolygonsButton.html(showPolygonsFlag ? 'Hide Polygons' : 'Show Polygons');
  redraw();
}

function updatePoints() {
  let polygons = voronoi.cellPolygons();
  let cells = Array.from(polygons);

  if (showPolygonsFlag) {
    showPolygons(cells);
  }

  let centroids = new Array(cells.length)
  let weights = new Array(cells.length).fill(0);

  for(let i = 0; i < centroids.length; i++) {
    centroids[i] = createVector(0, 0);
  }

  picture.loadPixels();
  let delaunayIndex = 0
  for(let i = 0; i < width; i++) {
    for(let j = 0; j < height; j++) {
      let cellIndex = (i + j * width) * 4;

      let r = picture.pixels[cellIndex + 0];
      let g = picture.pixels[cellIndex + 1];
      let b = picture.pixels[cellIndex + 2];
      let brightness = r * 0.2126 + g * 0.7152 + b * 0.0722;
      let weight = 1 - brightness / 255;
      delaunayIndex = delaunay.find(i, j, delaunayIndex);
      centroids[delaunayIndex].x += i * weight;
      centroids[delaunayIndex].y += j * weight;

      weights[delaunayIndex] += weight;
    }
  }

  for(let i = 0; i < centroids.length; i++) {
    if(weights[i] > 0) {
      centroids[i].div(weights[i]);
    } else {
      centroids[i] = points[i].copy();
    }
  }

  for(let i = 0; i < centroids.length; i++) {
    points[i].lerp(centroids[i], 0.2);
  }

  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function calculateDelaunay(points) {
  let pointsArray = [];
  for(let point of points) {
    pointsArray.push(point.x, point.y);
  }

  return new d3.Delaunay(pointsArray);
}
