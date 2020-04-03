//Counter API uses HTML elements attributes data such as [data-counter] looking for count elements
//The element as first argument of Counter must includes the elements with [data-counter] attribute noticed above.
class Counter {
    constructor(element, delay=100) {
        this.elem = element;
        this.items = element.querySelectorAll('[data-counter]');
        this.delay = delay;
        this.timerId;
        this.isShowen = false;
        window.addEventListener("scroll", () => {
            this.spoter();
        });
    }

    spoter() {
        let coords = this.elem.getBoundingClientRect();
        if(coords.bottom > 0 && 
           coords.top < document.documentElement.clientHeight) {
            if(this.isShowen) return;
            this.isShowen = true;      
            this.startCounter(this.elem);         
        } else {
            if(this.isShowen) {
                this.isShowen = false;
                this.reset(this.elem);
            };  
        }
    }

    startCounter() {
        this.timerId = setInterval(() => {
            let isFinish = true;   

            for(let item of this.items) {
                let value = parseInt(item.textContent);
                if(value < item.dataset.counter) {
                    isFinish = false;
                }
                // if this is the last element and its value is complete and another elemets values are complete
                if(item == this.items[this.items.length - 1] && value == item.dataset.counter && isFinish) { 
                    clearInterval(this.timerId);
                    return;
                }
                if(value == item.dataset.counter) {
                    continue;
                }
                item.textContent = value + 1;
            }

        }, this.delay);
    }

    reset() {
        for(let item of this.items) {
            item.textContent = "0";
        }
        clearInterval(this.timerId);
    }
};