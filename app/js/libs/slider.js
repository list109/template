
class Slider {
    constructor(slider, {pointClassName, pointsElem, time, arrowLeft, arrowRight}) { //the time argument takes number value as seconds
        this.sliderLine = slider.querySelector('[data-slider-line]');
        if(!this.sliderLine) return;

        this.sliderLine.style.cssText = "position: relative; transform: translateX(0px);"

        this.pointsElem = pointsElem;
        this.pointClassName = pointClassName || '';
        this.pointNumber = 0;

        this.interval;
        this.time = time;

        if(parseInt(time)) {
            setTimeout(this.timer.bind(this));  
            this.sliderLine.addEventListener('mouseenter', this.stopTimer.bind(this));
            this.sliderLine.addEventListener('mouseleave', this.timer.bind(this));
        };

        slider.addEventListener('click', this.handleEvent.bind(this));
        window.addEventListener("resize", this.reset.bind(this));
    }

    handleEvent(event) {
        if(event.type != "click") return;

        let point = event.target.closest('[data-slider-point]')
        if(point) {
            if(this.time) { // if the point was pressed then cancel the current timer and start it untill transition end 
                this.stopTimer();
                this.transitionEnd();
            }
            this.changePoints(point.dataset.sliderPoint - 1);
            return;
        }

        if(event.target.closest('[data-slider-arrow]')) this.arrows(event.target);
        
    }

    // arrows(elem) {
    //     let offsetWidth = this.sliderLine.offsetWidth;
    //     let left = parseInt(this.sliderLine.style.left);
    //     let amount = (elem.dataset.sliderArrow == 'left') ? left + offsetWidth : left - offsetWidth;
    //     amount = (amount > 0) ? 0 :
    //     // if the rest part of slider line smaller than 10px then no changes
    //     (this.sliderLine.scrollWidth + amount < 10) ? amount + offsetWidth : amount;
    //     this.sliderLine.style.left = amount + "px";
    // }

    movePoints(index) { // changes (moves) the slider tape (slider line) position

        let left = this.sliderLine.scrollWidth / this.sliderLine.children.length * index;
        this.sliderLine.style.transform = `translateX(-${left}px)`;
    }

    changePoints(index) { // changes a class of the pressed button (slider point) and moves the slider tape (slider line)  
        if(index > this.sliderLine.children.length - 1) return; 

        this.pointsElem.children[this.pointNumber].classList.remove(this.pointClassName);
        this.pointsElem.children[index].classList.add(this.pointClassName);
        this.pointNumber = index;
        setTimeout(this.movePoints(index));
    }

    timer() {
        this.interval = setInterval(() => {
            let index = this.pointNumber + 1;
            if(index > this.sliderLine.children.length - 1) index = 0;
            this.changePoints(index);
        }, 2 * 1000);
    }

    stopTimer() {
        clearInterval(this.interval);
    }

    transitionEnd() { // starts next time interval after current transition only
        if(parseFloat(getComputedStyle(this.sliderLine).transitionDuration)) { // if there's some animation
            this.sliderLine.ontransitionend = () => {
                this.timer();
                this.sliderLine.ontransitionend = false;
            }
        } else {
            this.stopTimer();
            this.timer();
        }
    }

    reset() {
        this.sliderLine.style.transform = `translateX(0px)`;
        this.changePoints(0);
    }
};

// Pattern of HTML slider:
// block slider
//     block slider-container
//         block slider-line  
//             blocks slider-item * n
//     [block slider-arrows]     
//     [block slider-points: [blocks data-point * n]]
