namespace tileworld {

    const yoff = 4;

    // the root of the editing experience is creating a (shared) tile map
    export class MapEditor extends BackgroundBase {
        private world: Image;
        private offsetX: number; // where are we in the world?
        private offsetY: number; 
        private cursor: Sprite;
        private selected: Sprite;
        private userSpriteIndex: number;
        private menu: Image;
        constructor(private p: Project) {
            super();
            this.world = p.getWorld();
            this.menu = image.create(2, 7);
            // cursors
            this.selected = sprites.create(cursorOut);
            this.selected.x = 24;
            this.selected.y = 8 + yoff;
            this.userSpriteIndex = 0;
            this.cursor = sprites.create(cursorIn);
            this.cursor.x = 40
            this.cursor.y = 56 + yoff;

            this.offsetX = this.offsetY = 0;
            this.update();

            controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.col() > 0)
                    this.cursor.x -= 16
                else {
                    this.offsetX -= 1;
                    this.update();
                }
            });
            controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.col() < 9)
                    this.cursor.x += 16
                else {
                    this.offsetX += 1;
                    this.update();
                }
            });
            controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.row() > 0)
                    this.cursor.y -= 16
                else {
                    this.offsetY -= 1;
                    this.update();
                }
            });
            controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.row() < 6)
                    this.cursor.y += 16
                else {
                    this.offsetY += 1;
                    this.update();
                }
            });
            controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
                this.cursorAction();
            });
            controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
                this.p.saveWorld();
                game.popScene();
            });
        }

        private updateSelection() {
            this.selected.x = this.cursor.x;
            this.selected.y = this.cursor.y;
        }

        private cursorAction() {
            if (this.col() > 1) {
                if (this.userSpriteIndex >= 0) {
                    let x = this.offsetX + this.col() - 2;
                    let y = this.offsetY + this.row();
                    this.world.setPixel(x, y, this.userSpriteIndex);
                    this.update();
                }
                return;
            }
            let menuItem = this.menu.getPixel(this.col(), this.row());
            if (this.row() > 2 && 0 <= menuItem && menuItem < this.p.all().length ) {
                // change user sprite
                this.userSpriteIndex = menuItem;
                this.updateSelection();
            } else {
               let command = commandImages[menuItem];
               if (command == paint) {
                    // paint
                    this.p.saveWorld();
                    game.pushScene();
                    new ImageEditor(this.p, this.userSpriteIndex);
                    return;
                } else if (command == pencil && this.userSpriteIndex >= this.p.fixed().length) {
                    this.p.saveWorld();
                    game.pushScene();
                    new RuleRoom(this.p, this.userSpriteIndex);
                    return;
                } else if (command == play) {
                    let rules = this.p.getRuleIds();
                    if (rules.length > 0) {
                        this.p.saveWorld();
                        game.pushScene();
                        let g = new RunGame(this.p, rules);
                        g.setWorld(this.world);
                        g.start();
                        return;
                    }         
                }
            }
            this.update();
        }

        private col(current: boolean = true) {
            return this.cursor.x >> 4;
        }
        
        private row(current: boolean = true) {
            return (this.cursor.y - yoff) >> 4;
        }

        private drawImage(img: Image, col: number, row: number) {
            screen.drawTransparentImage(img, col << 4, (row << 4)+yoff);
        }

        public update() {
            screen.fill(0);
            this.menu.fill(0xf);
            let x = 0;
            let y = 0;
            commandImages.forEach((img, index) => {
                this.drawImage(img == pencil ? (this.userSpriteIndex >= this.p.fixed().length ? img : greyImage(img)) : img, x, y);
                this.menu.setPixel(x, y, index);
                x++;
                if (x == 2) { x = 0; y++; }
            })
            x = 0; y = 3;
            this.p.fixed().forEach((img, index) => { 
                this.drawImage(img, x, y); 
                this.menu.setPixel(x, y, index);
                x++;
                if (x == 2) { x = 0; y++; }
            });
            x = 0; y = 5;
            this.p.movable().forEach((img, index) => {
                this.drawImage(img, x, y);
                this.menu.setPixel(x, y, this.p.fixed().length + index);
                x++;
                if (x == 2) { x = 0; y++; }
            });

            for(let x = this.offsetX; x<this.offsetX+8; x++) {
                for (let y = this.offsetY; y < this.offsetY + 7; y++) {
                    let index = 0 <= x && x < this.world.width && 0 <= y && y < this.world.height ? this.world.getPixel(x,y) : -1;
                    let col = 2 + (x - this.offsetX);
                    let row = (y - this.offsetY);
                    this.drawImage(index >= 0 ? this.p.getImage(index) : emptyTile, col, row);
                }    
            }
            screen.drawLine(32, yoff, 32, 119, 11)
        }
    } 
 }