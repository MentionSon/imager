// 1.对图片进行分类
// 2.生成DOM元素
// 3.绑定事件
// 4.显示到页面上

(function(window,document){
    let canChange = true;
    let curPreviewImgIndex = 0;

    const methods = {
        appendChild(parent, ...children){
            children.forEach(el => {
                parent.appendChild(el);
            });
        },
        $(selector, root = document){
            return root.querySelector(selector);
        },
        $$(selector, root = document){
            return root.querySelectorAll(selector);
        }
    };

    let Img = function(options){
        this._init(options);
        this._createElement();
        this._bind();
        this._show();
    };

    Img.prototype._init = function({data,initType,parasitifer}){
        this.types = ['全部'];            //全部的分类
        this.all = [];                   //所有图片元素
        this.classified = {'全部': []};  //按照类型分类后的图片
        this.curType = initType;        //当前显示的图片分类
        this.parasitifer = methods.$(parasitifer); //挂载点
        this.imgContanier = null;       //所有图片的容器
        this.wrap = null;               //整体容器
        this.typesBtnEls = null;        //所有分类按钮组成的数组
        this.figures = null;            //所有当前显示图片组成的数组

        this._classify(data);           //分组

        console.log(this.types);
        console.log(this.classified);
    };

    Img.prototype._classify = function(data){
        let srcs = [];

        data.forEach(({title,type,alt,src}) => {
            console.log(type, src);
            if(!this.types.includes(type)){
                this.types.push(type);
            }

            if(!Object.keys(this.classified).includes(type)){
                this.classified[type] = [];
            }

            if(!srcs.includes(src)){
                //图片没有生成过
                //生成图片
                //添加到对应的的分类中
                srcs.push(src);

                let figure = document.createElement('figure');
                let img = document.createElement('img');
                let figcaption = document.createElement('figcaption');

                img.src = src;
                img.setAttribute('alt', alt);
                figcaption.innerText = title;

                methods.appendChild(figure, img, figcaption);
                this.all.push(figure);
                this.classified[type].push(this.all.length - 1);
            } else {
                //去all中寻找对应的图片
                //然后添加到对应的分类中
                this.classified[type].push(srcs.findIndex(s1 => s1 === src));
            }
        });
    };

    Img.prototype._getImgsByType = function(type) {
        return type === '全部' ? [...this.all] : this.classified[type].map(index => this.all[index]);
      };

    //生成DOM
    Img.prototype._createElement = function(){
        //创建分类按钮
        let typesBtn = [];
        for(let type of this.types.values()){
            typesBtn.push(`<li class="__Img__classify__type-btn${type === this.curType ? ' __Img__type-btn-active' : ''}">${type}</li>`);
        }
        console.log(typesBtn);

        //整体的模板
        let tamplate = `<ul class="__Img__classify">
            ${typesBtn.join('')}
        </ul>
        <div class="__Img__img-container"></div>`;

        let wrap = document.createElement('div');
        wrap.className = '__Img__container';

        wrap.innerHTML = tamplate;

        this.imgContanier = methods.$('.__Img__img-container',wrap);

        methods.appendChild(this.imgContanier, ...this._getImgsByType(this.curType));

        this.wrap = wrap;
        this.typesBtnEls = [...methods.$$('.__Img__classify__type-btn', wrap)];
        this.figures = [...methods.$$('figure', wrap)];

        //遮罩层
        let overlay = document.createElement('div');
        overlay.className = '__Img__overlay';
        overlay.innerHTML = `<div class="__Img__overlay-prev-btn"></div>
        <div class="__Img__overlay-next-btn"></div>
        <img src="" alt=""></img>`;
        methods.appendChild(wrap, overlay);
        this.overlay = overlay;
        this.previewImg = methods.$('img', overlay);
        this._calcPostion(this.figures);
    };

    //计算出当前显示图片的集和点击后将显示的图片的集的交叉显示内容的下标 
    Img.prototype._diff = function(prevImgs, nextImgs) {
        let diffArr = [];

        prevImgs.forEach((src1, index1) => {
        let index2 = nextImgs.findIndex(src2 => src1 === src2);

        if (index2 !== -1) {
            diffArr.push([index1, index2]);
        }
        });

        return diffArr;
    };

    //绑定事件
    Img.prototype._bind = function(){
        methods.$('.__Img__classify', this.wrap).addEventListener('click', ({target}) => {
            if(target.nodeName !== 'LI') return;
            console.log(target.innerHTML);

            if(!canChange) return;
            canChange = false;

            const type = target.innerText;
            const els = this._getImgsByType(type);

            let prevImgs = this.figures.map(figure => methods.$('img', figure).src);
            let nextImgs = els.map(figure => methods.$('img', figure).src );
            const diffArr = this._diff(prevImgs, nextImgs);

            diffArr.forEach(([,i2]) => {
                this.figures.every((figure, index) => {
                    let src = methods.$('img', figure).src;

                    if(src === nextImgs[i2]){
                        this.figures.splice(index,1);
                        return false;
                    }
                    return true;
                });
            }); 

            this._calcPostion(els);
            
            let needAppendEls = [];
            if(diffArr.length){
                let nextElsIndex = diffArr.map(([,i2]) => i2);

                els.forEach((figure, index) => {
                    if(!nextElsIndex.includes(index)) needAppendEls.push(figure);
                });
            } else {
                needAppendEls = els;
            }

            this.figures.forEach(el => {
                el.style.transform = 'scale(0, 0) translate(0%, 100%)';
                el.style.opacity = '0';
            });

            methods.appendChild(this.imgContanier, ...needAppendEls);
            console.log(needAppendEls);
            setTimeout(() => {
                els.forEach(el => {
                    el.style.transform = 'scale(1, 1) translate(0, 0)';
                    el.style.opacity = '1';
                })
            });

            setTimeout(() => {
                this.figures.forEach(figure => {
                    this.imgContanier.removeChild(figure);
                });

                canChange = true;
                this.figures = els;
            },600);

            this.typesBtnEls.forEach(btn => (btn.className = '__Img__classify__type-btn'));
            target.className = '__Img__classify__type-btn __Img__type-btn-active';
        });
        
        //遮罩层开启,进入图片预览模式
        this.imgContanier.addEventListener('click', ({target}) => {
            if(target.nodeName !== 'FIGURE' && target.nodeName !== 'FIGCAPTION') return;

            if(target.nodeName === 'FIGCAPTION'){
                target = target.parentNode;
            }

            const src = methods.$('img', target).src;
            
            curPreviewImgIndex = this.figures.findIndex(figure => src === methods.$('img', figure).src);
            
            this.previewImg.src = src;

            this.overlay.style.display = 'flex';
            setTimeout(() => {
                this.overlay.style.opacity = '1';
            });
        });
        
        //关闭遮罩层,整体淡出
        this.overlay.addEventListener('click', () => {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.style.display = 'none';
            },500);
        });

        //预览模式按钮控制
        methods.$('.__Img__overlay-prev-btn', this.overlay).addEventListener('click', e => {
            e.stopPropagation();

            curPreviewImgIndex = curPreviewImgIndex === 0 ? this.figures.length - 1 : curPreviewImgIndex - 1;
            this.previewImg.src = methods.$('img', this.figures[curPreviewImgIndex]).src;
        });
        methods.$('.__Img__overlay-next-btn', this.overlay).addEventListener('click', e => {
            e.stopPropagation();

            curPreviewImgIndex = curPreviewImgIndex === this.figures.length - 1 ? 0 : curPreviewImgIndex + 1;
            this.previewImg.src = methods.$('img', this.figures[curPreviewImgIndex]).src;
        });
    };

    //显示元素
    Img.prototype._show = function(){
        methods.appendChild(this.parasitifer, this.wrap);

        setTimeout(() => {
            this.figures.forEach(figure => {
                figure.style.transform = 'scale(1,1) translate(0,0)';
                figure.style.opacity = '1';
            });
        });
    };
    //计算图片位置
    Img.prototype._calcPostion = function(figures){
        let horizontalImgIndex = 0;

        figures.forEach((figure, index) => {
            figure.style.top = Math.floor(index / 4) * (140 + 15) + 'px';
            //figure.style.left = (index % 4 - 1) * (240 + 15) + 'px';
            figure.style.left = horizontalImgIndex * (240 + 15) + 'px';
            figure.style.transform = 'scale(0,0) translate(0,-100%)';
            horizontalImgIndex = (horizontalImgIndex + 1) % 4;
        });

        let len = Math.ceil(figures.length / 4);
        this.imgContanier.style.height = len * 140 + (len - 1) * 15 + 'px';
    }

    window.$Img = Img;
})(window,document);