
class Slider {
    constructor(slider, {pointClassName, pointsElem, time, arrowLeft, arrowRight}) { //the time argument takes a number value as seconds
        this.sliderLine = slider.querySelector('[data-slider-line]');
        if(!this.sliderLine) return;

        this.sliderLine.style.cssText = "transform: translateX(0px);"

        this.pointsElem = pointsElem;
        this.pointClassName = pointClassName || 'pointClassName';
        this.pointNumber = 0;

        this.interval;
        this.time = time;

        this.isPressed = false;
        this.moveWithPressedMouse = this.moveWithPressedMouse.bind(this);

        if(parseInt(time)) {
            this.startTimer();  
            this.sliderLine.addEventListener('mouseenter', this.stopTimer.bind(this));
            this.sliderLine.addEventListener('mouseleave', this.startTimer.bind(this));
        };

        slider.addEventListener('click', this.handleEvent.bind(this));
        slider.addEventListener('mousedown', this.handleEvent.bind(this));
        slider.addEventListener('mouseup', this.handleEvent.bind(this));
        window.addEventListener('resize', this.reset.bind(this));
    }

    handleEvent(event) {

        let point = event.target.closest('[data-slider-point]');
        if(point && event.type == "click") {
            if(!point.classList.contains(this.pointClassName)) event.preventDefault(); //prevent the pressed link going if it is the first time
            if(point.dataset.sliderPoint - 1 == this.pointNumber) return; //if the pressed button is the same one like in the previous time then to return
            if(this.time) { // if the point have pressed then to cancel the current timer and start it untill the transition end 
                this.stopTimer(); // stop the timer anyway
                this.startTimer();
            }
            this.changePoints(point.dataset.sliderPoint - 1);
            return;
        }

        if(event.target.closest('[data-slider-line]')) {
            switch(event.type) {
                case 'mousedown':
                    this.startWithPressedMouse(event);
                    break;  
                case 'dbclick':    
                case 'mouseup':
                    this.endWithPressedMouse(event.clientX);
                    break;
            }
        } 
        //if(event.target.closest('[data-slider-arrow]')) this.arrows(event.target);
        
    }

    /* arrows(elem) {
        let offsetWidth = this.sliderLine.offsetWidth;
        let left = parseInt(this.sliderLine.style.left);
        let amount = (elem.dataset.sliderArrow == 'left') ? left + offsetWidth : left - offsetWidth;
        amount = (amount > 0) ? 0 :
        // if the rest part of slider line smaller than 10px then no changes
        (this.sliderLine.scrollWidth + amount < 10) ? amount + offsetWidth : amount;
        this.sliderLine.style.left = amount + "px";
    } */

    moveSlider(index) { // changes (moves) the slider tape (slider line) position
        let left = this.sliderLine.scrollWidth / this.sliderLine.children.length * index;
        this.sliderLine.style.transform = `translateX(-${left}px)`;
    }

    changePoints(index) { // changes a class of the pressed button (slider point) and moves the slider tape (slider line)  
        index = (index < 0) ? this.sliderLine.children.length - 1 : 
                (index > this.sliderLine.children.length - 1) ? 0 : index;

        this.pointsElem.children[this.pointNumber].classList.remove(this.pointClassName);
        this.pointsElem.children[index].classList.add(this.pointClassName);
        this.pointNumber = index;
        this.moveSlider(index);
    }


    startWithPressedMouse(event) {
        this.isPressed = true;
        this.startDistance = event.clientX;

        this.initialSlide = event.target.closest('[data-slider-item]'); //decision of currently for a single visible slide of the slider

        this.initialTransform = +getComputedStyle(this.sliderLine).transform.split(',')[4];
        this.sliderLine.style.transition = 'initial';

        window.addEventListener('mousemove', this.moveWithPressedMouse);
    }
    endWithPressedMouse(clientX) {
        if(!this.isPressed) return;

        this.isPressed = false;
        this.sliderLine.style.transition = '';

        let diffOfDistance = clientX - this.startDistance;
        if(Math.abs(diffOfDistance)  < this.sliderLine.offsetWidth * .3) {
            this.sliderLine.style.transform = `translateX(${this.initialTransform}px)`;
        } else {
            this.changePoints((diffOfDistance < 0) ? this.pointNumber + 1 : this.pointNumber - 1);
        }

        window.removeEventListener('mousemove', this.moveWithPressedMouse);
    }
    moveWithPressedMouse(event) {
        let diffOfDistance =  event.clientX - this.startDistance;
        
        let shift = this.initialTransform + diffOfDistance;
        let maxShift = -(this.sliderLine.scrollWidth - this.sliderLine.clientWidth);
        shift = (shift >= 0) ? 0 :
                (shift <= maxShift) ? maxShift : shift;       

        this.sliderLine.style.transform = `translateX(${shift}px)`;
        
        let currentElem = document.elementFromPoint(event.clientX, event.clientY);
        if(!this.sliderLine.contains(currentElem)) this.endWithPressedMouse(this.prevClientX);

        this.prevClientX = event.clientX; 

        event.preventDefault();
    }


    startTimer() {
        this.interval = setInterval(() => {
            console.log(`setTimeout: ${this.timeout}`);
            let index = this.pointNumber + 1;
            this.changePoints(index);
        }, this.time * 1000);
    }
    
    stopTimer() {
        clearInterval(this.interval);
    }

    reset() {
        this.sliderLine.style.transform = `translateX(0px)`;
        this.changePoints(0);
    }
};

// Pattern of the HTML slider:
// block slider                          // defines the total width of the slider's page (container)
//     block slider-container            // defines a width of the slider 
//         block [data-slider-line]             // defines the tape of the slider, that moves through
//             blocks [data-slider-item='number'] * n
//         block slider-arrows   
//         block slider-points
//             blocks [data-slider-point='number'] * n




//this.transitionStartTimer(); // use transitionStartTimer instead usuall startTimer to consider transition time

//this.sliderLine.ontransitionend = false;

// transitionStartTimer() { // starts the next time interval after the current transition only
//     if(parseFloat(getComputedStyle(this.sliderLine).transitionDuration)) { // if there's some animation
//         this.sliderLine.ontransitionend = () => {
//             this.startTimer();
//             this.sliderLine.ontransitionend = false;
//         }
//     } else {
//         this.startTimer();
//     }
// }

