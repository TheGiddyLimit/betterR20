function baseWeather () {
	d20plus.weather = {};

	d20plus.weather.props = {
		"weatherType1": "None",
		"weatherTypeCustom1": "",
		"weatherSpeed1": "0.4",
		"weatherDir1": "Northerly",
		"weatherDirCustom1": "180",
		"weatherOpacity1": "0.5",
		"weatherOscillate1": false,
		"weatherOscillateThreshold1": "0.5",
		"weatherIntensity1": "Normal",
		"weatherTint1": false,
		"weatherTintColor1": "#4c566d",
		"weatherTintOpacity1": "0.5",
		"weatherEffect1": "None",
	};

	d20plus.weather.addWeather = () => {
		window.force = false; // missing variable in Roll20's code(?); define it here

		d20plus.ut.log("Adding weather");

		const MAX_ZOOM = 2.5; // max canvas zoom
		const tmp = []; // temp vector
		// cache images
		const IMAGES = {
			"Rain": new Image(),
			"Snow": new Image(),
			"Fog": new Image(),
			"Waves": new Image(),
			"Ripples": new Image(),
			"Blood Rain": new Image(),
		};
		IMAGES.Rain.src = "https://i.imgur.com/lZrqiVk.png";
		IMAGES.Snow.src = "https://i.imgur.com/uwLQjWY.png";
		IMAGES.Fog.src = "https://i.imgur.com/SRsUpHW.png";
		IMAGES.Waves.src = "https://i.imgur.com/iYEzmvB.png";
		IMAGES.Ripples.src = "https://i.imgur.com/fFCr0yx.png";
		IMAGES["Blood Rain"].src = "https://i.imgur.com/SP2aoeq.png";
		const SFX = {
			lightning: [],
		};

		// FIXME find a better way of handling this; `clip` is super-slow
		const clipMode = "EXCLUDE";

		function SfxLightning () {
			this.brightness = 255;
		}

		const $wrpEditor = $("#editor-wrapper");

		// add custom canvas
		const $wrpCanvas = $wrpEditor.find(".canvas-container");

		// make buffer canvas
		const $canBuf = $("<canvas style='position: absolute; z-index: -100; left:0; top: 0; pointer-events: none;' tabindex='-1'/>").appendTo($wrpCanvas);
		const cvBuf = $canBuf[0];
		const ctxBuf = cvBuf.getContext("2d");

		// make weather canvas
		const $canvasWeather = $("<canvas id='Vet-canvas-weather' style='position: absolute; z-index: 2; left:0; top: 0; pointer-events: none;' tabindex='-1'/>").appendTo($wrpCanvas);
		const cv = $canvasWeather[0];
		d20.engine.weathercanvas = cv;

		// add our canvas to those adjusted when canvas size changes
		const cachedSetCanvasSize = d20.engine.setCanvasSize;
		d20.engine.setCanvasSize = function (e, n) {
			cv.width = e;
			cv.height = n;

			cvBuf.width = e;
			cvBuf.height = n;

			cachedSetCanvasSize(e, n);
		};

		cv.width = cvBuf.width = d20.engine.canvasWidth;
		cv.height = cvBuf.height = d20.engine.canvasHeight;

		const ctx = cv.getContext("2d");

		const CTX = {
			_hasWarned: new Set(),
		};

		function ofX (x) { // offset X
			return x - d20.engine.currentCanvasOffset[0];
		}

		function ofY (y) { // offset Y
			return y - d20.engine.currentCanvasOffset[1];
		}

		function lineIntersectsBounds (points, bounds) {
			return d20plus.math.doPolygonsIntersect([points[0], points[2], points[3], points[1]], bounds);
		}

		function copyPoints (toCopy) {
			return [...toCopy.map(pt => [...pt])];
		}

		function getImage (page) {
			const imageName = page.get("bR20cfg_weatherType1");

			switch (imageName) {
				case "Rain":
				case "Snow":
				case "Fog":
				case "Waves":
				case "Ripples":
				case "Blood Rain":
					IMAGES["Custom"] = null;
					return IMAGES[imageName];
				case "Custom (see below)":
					if (!IMAGES["Custom"] || (
						(IMAGES["Custom"].src !== page.get("bR20cfg_weatherTypeCustom1") && IMAGES["Custom"]._errorSrc == null)
						|| (IMAGES["Custom"]._errorSrc != null && IMAGES["Custom"]._errorSrc !== page.get("bR20cfg_weatherTypeCustom1")))
					) {
						IMAGES["Custom"] = new Image();
						IMAGES["Custom"]._errorSrc = null;
						IMAGES["Custom"].onerror = () => {
							if (IMAGES["Custom"]._errorSrc == null) {
								IMAGES["Custom"]._errorSrc = page.get("bR20cfg_weatherTypeCustom1");
								alert(`Custom weather image "${IMAGES["Custom"].src}" failed to load!`);
							}
							IMAGES["Custom"].src = IMAGES["Rain"].src;
						};
						IMAGES["Custom"].src = page.get("bR20cfg_weatherTypeCustom1");
					}
					return IMAGES["Custom"];
				default:
					IMAGES["Custom"] = null;
					return null;
			}
		}

		function getDirectionRotation (page) {
			const dir = page.get("bR20cfg_weatherDir1") || d20plus.weather.props.weatherDir1;
			switch (dir) {
				case "Northerly": return 0.25 * Math.PI;
				case "North-Easterly": return 0.5 * Math.PI;
				case "Easterly": return 0.75 * Math.PI;
				case "South-Easterly": return Math.PI;
				case "Southerly": return 1.25 * Math.PI;
				case "South-Westerly": return 1.5 * Math.PI;
				case "Westerly": return 1.75 * Math.PI;
				case "North-Westerly": return 0;
				case "Custom (see below)":
					return Number(page.get("bR20cfg_weatherDirCustom1") || d20plus.weather.props.weatherDirCustom1) * Math.PI / 180;
				default: return 0;
			}
		}

		function getOpacity (page) {
			return page.get("bR20cfg_weatherOpacity1") || d20plus.weather.props.weatherOpacity1;
		}

		let oscillateMode = null;
		function isOscillating (page) {
			return !!page.get("bR20cfg_weatherOscillate1");
		}

		function getOscillationThresholdFactor (page) {
			return page.get("bR20cfg_weatherOscillateThreshold1") || d20plus.weather.props.weatherOscillateThreshold1;
		}

		function getIntensity (page) {
			const tint = page.get("bR20cfg_weatherIntensity1");
			switch (tint) {
				case "Heavy": return 1;
				default: return 0;
			}
		}

		function getTintColor (page) {
			const tintEnabled = page.get("bR20cfg_weatherTint1");
			if (tintEnabled) {
				const tintOpacity = page.get("bR20cfg_weatherTintOpacity1") || d20plus.weather.props.weatherTintOpacity1;
				const tintOpacityHex = tintOpacity ? Math.round(255 * tintOpacity).toString(16) : 80;
				return `${(page.get("bR20cfg_weatherTintColor1") || d20plus.weather.props.weatherTintColor1)}${tintOpacityHex}`;
			} else return null;
		}

		function getEffect (page) {
			const effect = page.get("bR20cfg_weatherEffect1");
			switch (effect) {
				case "Lightning": return "lightning";
				default: return null;
			}
		}

		function handleSvgCoord (coords, obj, basesXY, center, angle) {
			const vec = [
				ofX(coords[0] * obj.scaleX) + basesXY[0],
				ofY(coords[1] * obj.scaleY) + basesXY[1],
			];
			d20plus.math.vec2.scale(vec, vec, d20.engine.canvasZoom);
			if (angle) d20plus.math.vec2.rotate(vec, vec, center, angle);
			return vec;
		}

		let accum = 0;
		let then = 0;
		let image;
		let currentSfx;
		let hasWeather = false;
		function drawFrame (now) {
			const deltaTime = now - then;
			then = now;

			const page = d20 && d20.Campaign && d20.Campaign.activePage ? d20.Campaign.activePage() : null;
			if (page && page.get("bR20cfg_weatherType1") !== "None") {
				image = getImage(page);
				currentSfx = getEffect(page);

				// generate SFX
				if (currentSfx) {
					if (currentSfx === "lightning" && Math.random() > 0.999) SFX.lightning.push(new SfxLightning());
				} else {
					SFX.lightning = [];
				}

				if (hasWeather) ctx.clearRect(0, 0, cv.width, cv.height);
				const hasImage = image && image.complete;
				const tint = getTintColor(page);
				const scaledW = hasImage ? Math.ceil((image.width * d20.engine.canvasZoom) / MAX_ZOOM) : -1;
				const scaledH = hasImage ? Math.ceil((image.height * d20.engine.canvasZoom) / MAX_ZOOM) : -1;
				const hasSfx = SFX.lightning.length;
				if (hasImage || tint || hasSfx) {
					hasWeather = true;

					// draw weather
					if (
						hasImage
						&& !(scaledW <= 0 || scaledH <= 0) // sanity check
					) {
						// mask weather
						const doMaskStep = () => {
							ctxBuf.clearRect(0, 0, cvBuf.width, cvBuf.height);

							ctxBuf.fillStyle = "#ffffffff";

							const objectLen = d20.engine.canvas._objects.length;
							for (let i = 0; i < objectLen; ++i) {
								const obj = d20.engine.canvas._objects[i];
								if (obj.type === "path" && obj.model && obj.model.get("layer") === "weather") {
									// obj.top is X pos of center of object
									// obj.left is Y pos of center of object
									const xBase = (obj.left - (obj.width * obj.scaleX / 2));
									const yBase = (obj.top - (obj.height * obj.scaleY / 2));
									const basesXY = [xBase, yBase];
									const angle = (obj.angle > 360 ? obj.angle - 360 : obj.angle) / 180 * Math.PI;
									const center = [ofX(obj.left), ofY(obj.top)];
									d20plus.math.vec2.scale(center, center, d20.engine.canvasZoom);

									ctxBuf.beginPath();
									obj.path.forEach(opp => {
										const [op, x, y, ...others] = opp;
										switch (op) {
											case "M": {
												const vec = handleSvgCoord([x, y], obj, basesXY, center, angle);
												ctxBuf.moveTo(vec[0], vec[1]);
												break;
											}
											case "L": {
												const vec = handleSvgCoord([x, y], obj, basesXY, center, angle);
												ctxBuf.lineTo(vec[0], vec[1]);
												break;
											}
											case "C": {
												const control1 = handleSvgCoord([x, y], obj, basesXY, center, angle);
												const control2 = handleSvgCoord([others[0], others[1]], obj, basesXY, center, angle);
												const end = handleSvgCoord([others[2], others[3]], obj, basesXY, center, angle);
												ctxBuf.bezierCurveTo(...control1, ...control2, ...end);
												break;
											}
											default:
												if (!CTX._hasWarned.has(op)) {
													CTX._hasWarned.add(op);
													// eslint-disable-next-line no-console
													console.error(`UNHANDLED OP!: ${op}`);
												}
										}
									});
									ctxBuf.fill();
									ctxBuf.closePath();
								}
							}

							// draw final weather mask
							/// / change drawing mode
							ctx.globalCompositeOperation = "destination-out";
							ctx.drawImage(cvBuf, 0, 0);

							// handle opacity
							const opacity = Number(getOpacity(page));
							if (opacity !== 1) {
								ctxBuf.clearRect(0, 0, cvBuf.width, cvBuf.height);
								ctxBuf.fillStyle = `#ffffff${Math.round((1 - opacity) * 255).toString(16)}`;
								ctxBuf.fillRect(0, 0, cvBuf.width, cvBuf.height);
								ctx.drawImage(cvBuf, 0, 0);
							}

							/// / reset drawing mode
							ctx.globalCompositeOperation = "source-over";
						};

						// if (clipMode === "INCLUDE") doMaskStep(true);

						const speed = page.get("bR20cfg_weatherSpeed1") || d20plus.weather.props.weatherSpeed1;
						const speedFactor = speed * d20.engine.canvasZoom;
						const maxAccum = Math.floor(scaledW / speedFactor);
						const rot = getDirectionRotation(page);
						const w = scaledW;
						const h = scaledH;
						const boundingBox = [
							[
								-1.5 * w,
								-1.5 * h,
							],
							[
								-1.5 * w,
								cv.height + (1.5 * h) + d20.engine.currentCanvasOffset[1],
							],
							[
								cv.width + (1.5 * w) + d20.engine.currentCanvasOffset[0],
								cv.height + (1.5 * h) + d20.engine.currentCanvasOffset[1],
							],
							[
								cv.width + (1.5 * w) + d20.engine.currentCanvasOffset[0],
								-1.5 * h,
							],
						];
						const BASE_OFFSET_X = -w / 2;
						const BASE_OFFSET_Y = -h / 2;

						// calculate resultant points of a rotated shape
						const pt00 = [0, 0];
						const pt01 = [0, 1];
						const pt10 = [1, 0];
						const pt11 = [1, 1];
						const basePts = [
							pt00,
							pt01,
							pt10,
							pt11,
						].map(pt => [
							(pt[0] * w) + BASE_OFFSET_X - d20.engine.currentCanvasOffset[0],
							(pt[1] * h) + BASE_OFFSET_Y - d20.engine.currentCanvasOffset[1],
						]);
						basePts.forEach(pt => d20plus.math.vec2.rotate(pt, pt, [0, 0], rot));

						// calculate animation values
						(() => {
							if (isOscillating(page)) {
								const oscThreshFactor = getOscillationThresholdFactor(page);

								if (oscillateMode == null) {
									oscillateMode = 1;
									accum += deltaTime;
									if (accum >= maxAccum * oscThreshFactor) accum -= maxAccum;
								} else {
									if (oscillateMode === 1) {
										accum += deltaTime;
										if (accum >= maxAccum * oscThreshFactor) {
											accum -= 2 * deltaTime;
											oscillateMode = -1;
										}
									} else {
										accum -= deltaTime;
										if (accum <= 0) {
											oscillateMode = 1;
											accum += 2 * deltaTime;
										}
									}
								}
							} else {
								oscillateMode = null;
								accum += deltaTime;
								if (accum >= maxAccum) accum -= maxAccum;
							}
						})();

						const intensity = getIntensity(page) * speedFactor;
						const timeOffsetX = Math.ceil(speedFactor * accum);
						const timeOffsetY = Math.ceil(speedFactor * accum);

						/// / rotate coord space
						ctx.rotate(rot);

						// draw base image
						const doDraw = (offsetX, offsetY) => {
							const xPos = BASE_OFFSET_X + timeOffsetX + offsetX - d20.engine.currentCanvasOffset[0];
							const yPos = BASE_OFFSET_Y + timeOffsetY + offsetY - d20.engine.currentCanvasOffset[1];
							ctx.drawImage(
								image,
								xPos,
								yPos,
								w,
								h,
							);

							if (intensity) {
								const offsetIntensity = -Math.floor(w / 4);
								ctx.drawImage(
									image,
									xPos + offsetIntensity,
									yPos + offsetIntensity,
									w,
									h,
								);
							}
						}

						const inBounds = (nextPts) => {
							return lineIntersectsBounds(nextPts, boundingBox);
						}

						const moveXDir = (pt, i, isAdd) => {
							if (i % 2) d20plus.math.vec2.sub(tmp, basePts[3], basePts[1]);
							else d20plus.math.vec2.sub(tmp, basePts[2], basePts[0]);

							if (isAdd) d20plus.math.vec2.add(pt, pt, tmp);
							else d20plus.math.vec2.sub(pt, pt, tmp);
						}

						const moveYDir = (pt, i, isAdd) => {
							if (i > 1) d20plus.math.vec2.sub(tmp, basePts[3], basePts[2]);
							else d20plus.math.vec2.sub(tmp, basePts[1], basePts[0]);

							if (isAdd) d20plus.math.vec2.add(pt, pt, tmp);
							else d20plus.math.vec2.sub(pt, pt, tmp);
						}

						const getMaxMoves = () => {
							const hyp = [];
							d20plus.math.vec2.sub(hyp, boundingBox[2], boundingBox[0]);

							const dist = d20plus.math.vec2.len(hyp);
							const maxMoves = dist / Math.min(w, h);
							return [Math.abs(hyp[0]) > Math.abs(hyp[1]) ? "x" : "y", maxMoves];
						};

						const handleXAxisYIncrease = (nxtPts, maxMoves, moves, xDir) => {
							const handleY = (dir) => {
								let subNxtPts, subMoves;
								subNxtPts = copyPoints(nxtPts);
								subMoves = 0;
								while (subMoves <= maxMoves[1]) {
									subNxtPts.forEach((pt, i) => moveYDir(pt, i, dir > 0));
									subMoves++;
									if (inBounds(subNxtPts)) doDraw(xDir * moves * w, dir * (subMoves * h));
								}
							};

							handleY(1); // y axis increasing
							handleY(-1); // y axis decreasing
						};

						const handleYAxisXIncrease = (nxtPts, maxMoves, moves, yDir) => {
							const handleX = (dir) => {
								let subNxtPts, subMoves;
								subNxtPts = copyPoints(nxtPts);
								subMoves = 0;
								while (subMoves <= maxMoves[1]) {
									subNxtPts.forEach((pt, i) => moveXDir(pt, i, dir > 0));
									subMoves++;
									if (lineIntersectsBounds(subNxtPts, boundingBox)) doDraw(dir * (subMoves * w), yDir * moves * h);
								}
							};

							handleX(1); // x axis increasing
							handleX(-1); // x axis decreasing
						};

						const handleBasicX = (maxMoves) => {
							const handleX = (dir) => {
								let nxtPts, moves;
								nxtPts = copyPoints(basePts);
								moves = 0;
								while (moves < maxMoves) {
									nxtPts.forEach((pt, i) => moveXDir(pt, i, dir > 0));
									moves++;
									if (lineIntersectsBounds(nxtPts, boundingBox)) doDraw(dir * (moves * w), 0);
								}
							};

							handleX(1); // x axis increasing
							handleX(-1); // x axis decreasing
						};

						const handleBasicY = (maxMoves) => {
							const handleY = (dir) => {
								let nxtPts, moves;
								nxtPts = copyPoints(basePts);
								moves = 0;
								while (moves < maxMoves) {
									nxtPts.forEach((pt, i) => moveYDir(pt, i, dir > 0));
									moves++;
									if (lineIntersectsBounds(nxtPts, boundingBox)) doDraw(0, dir * (moves * h));
								}
							};

							handleY(1); // y axis increasing
							handleY(-1); // y axis decreasing
						};

						doDraw(0, 0);

						(() => {
							// choose largest axis
							const maxMoves = getMaxMoves();

							if (maxMoves[0] === "x") {
								const handleX = (dir) => {
									let nxtPts, moves;
									nxtPts = copyPoints(basePts);
									moves = 0;
									while (moves < maxMoves[1]) {
										nxtPts.forEach((pt, i) => moveXDir(pt, i, dir > 0));
										moves++;
										if (lineIntersectsBounds(nxtPts, boundingBox)) doDraw(dir * (moves * w), 0);
										handleXAxisYIncrease(nxtPts, maxMoves, moves, dir);
									}
								};

								handleBasicY(maxMoves[1]);
								handleX(1); // x axis increasing
								handleX(-1); // x axis decreasing
							} else {
								const handleY = (dir) => {
									let nxtPts, moves;
									nxtPts = copyPoints(basePts);
									moves = 0;
									while (moves < maxMoves[1]) {
										nxtPts.forEach((pt, i) => moveYDir(pt, i, dir > 0));
										moves++;
										if (lineIntersectsBounds(nxtPts, boundingBox)) doDraw(0, dir * (moves * h));
										handleYAxisXIncrease(nxtPts, maxMoves, moves, dir);
									}
								};

								handleBasicX(maxMoves[1]);
								handleY(1); // y axis increasing
								handleY(-1); // y axis decreasing
							}
						})();

						/// / revert coord space rotation
						ctx.rotate(-rot);

						if (clipMode === "EXCLUDE") doMaskStep(false);
					}

					// draw sfx
					if (hasSfx) {
						for (let i = SFX.lightning.length - 1; i >= 0; --i) {
							const l = SFX.lightning[i];
							if (l.brightness <= 5) {
								SFX.lightning.splice(i, 1);
							} else {
								ctx.fillStyle = `#effbff${l.brightness.toString(16).padStart(2, "0")}`;
								ctx.fillRect(0, 0, cv.width, cv.height);
								l.brightness -= Math.floor(deltaTime);
							}
						}
					}

					// draw tint
					if (tint) {
						ctx.fillStyle = tint;
						ctx.fillRect(0, 0, cv.width, cv.height);
					}
				}

				requestAnimationFrame(drawFrame);
			} else {
				// if weather is disabled, maintain a background tick
				if (hasWeather) {
					ctx.clearRect(0, 0, cv.width, cv.height);
					hasWeather = false;
				}
				setTimeout(() => {
					drawFrame(0);
				}, 1000);
			}
		}

		requestAnimationFrame(drawFrame);
	};
}

SCRIPT_EXTENSIONS.push(baseWeather);
