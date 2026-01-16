let video;
let faceMesh; // 面部网格模型
let faces = []; // 存储检测到的面部数据
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

// 赞美词库
let words = ["自信", "光芒", "智慧", "优雅", "美丽", "大方", "勇敢", "卓越", "无畏", "阳光", "独特", "迷人"]; 

// 关键点索引映射 (MediaPipe FaceMesh 标准索引)
// 这些数字代表了脸上特定的点
let faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
let leftEyebrowIndices = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
let rightEyebrowIndices = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];
let leftEyeIndices = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]; // 眼镜左
let rightEyeIndices = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]; // 眼镜右
let noseIndices = [168, 6, 197, 195, 5]; // 鼻子竖线
let mouthIndices = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]; // 嘴巴外轮廓

function preload() {
  // 预加载 FaceMesh 模型
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  
  // 视频设置
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  
  // 启动检测
  faceMesh.detectStart(video, gotFaces);
  
  // 文字样式设置
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  textFont('Georgia'); // 使用衬线字体，更接近参考图的艺术感
}

function draw() {
  background(255); // 纯白背景
  fill(0); // 黑色文字
  noStroke(); // 无线条
  
  // 如果检测到了人脸
  if (faces.length > 0) {
    let face = faces[0]; // 获取第一张脸
    
    // 1. 绘制脸部轮廓 (闭合)
    drawTextAlongIndices(face, faceOvalIndices, true);
    
    // 2. 绘制眉毛 (不闭合)
    drawTextAlongIndices(face, leftEyebrowIndices, false);
    drawTextAlongIndices(face, rightEyebrowIndices, false);
    
    // 3. 绘制眼睛/眼镜 (闭合)
    drawTextAlongIndices(face, leftEyeIndices, true);
    drawTextAlongIndices(face, rightEyeIndices, true);
    
    // 4. 绘制鼻子 (竖线，不闭合)
    drawTextAlongIndices(face, noseIndices, false);
    
    // 5. 绘制嘴巴 (闭合)
    drawTextAlongIndices(face, mouthIndices, true);
  }
}

// 回调函数：当ml5检测到人脸时运行
function gotFaces(results) {
  faces = results;
}

/**
 * 核心功能：沿着关键点路径画文字
 * @param {Object} face - 面部数据对象
 * @param {Array} indices - 需要连接的关键点索引数组
 * @param {Boolean} isClosed - 形状是否闭合（如嘴巴是闭合的，眉毛是不闭合的）
 */
function drawTextAlongIndices(face, indices, isClosed) {
  let keypoints = face.keypoints;
  let wordIndex = 0;
  
  // 遍历所有指定的索引点
  for (let i = 0; i < indices.length; i++) {
    // 获取当前点和下一个点
    let currentIndex = indices[i];
    let nextIndex;
    
    // 处理闭合形状的逻辑：如果是最后一个点，且要求闭合，则连接回第一个点
    if (i === indices.length - 1) {
      if (isClosed) {
        nextIndex = indices[0];
      } else {
        break; // 如果不闭合，画到最后一个点就停止
      }
    } else {
      nextIndex = indices[i + 1];
    }
    
    let p1 = keypoints[currentIndex];
    let p2 = keypoints[nextIndex];
    
    // 镜像处理：因为webcam通常是镜像的，我们需要把x坐标翻转一下
    // 注意：ml5的坐标已经是基于视频尺寸的，但为了像镜子一样，我们通常用 width - x
    // 这里为了简单，我们假设你想要“所见即所得”，直接用坐标。
    // 如果发现方向反了，可以将 p1.x 改为 width - p1.x
    
    let x1 = width - p1.x; // 镜像翻转
    let y1 = p1.y;
    let x2 = width - p2.x; // 镜像翻转
    let y2 = p2.y;
    
    // 计算两点之间的距离
    let d = dist(x1, y1, x2, y2);
    
    // 计算两点之间的角度
    let angle = atan2(y2 - y1, x2 - x1);
    
    // 在这两点之间填入文字
    // 这是一个插值过程：如果两点距离很远，我们要多填几个字
    let textGap = 18; // 每个字之间的间距（像素）
    let steps = floor(d / textGap);
    
    for (let j = 0; j < steps; j++) {
      // 计算当前字的位置 (线性插值)
      let t = j / steps;
      let cx = lerp(x1, x2, t);
      let cy = lerp(y1, y2, t);
      
      let currentWord = words[wordIndex % words.length];
      
      push();
      translate(cx, cy);
      rotate(angle); // 让文字旋转，跟随线条走向
      text(currentWord, 0, 0);
      pop();
      
      wordIndex++;
    }
  }
}