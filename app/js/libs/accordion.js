class Accordion {
    constructor(classBtn) {
        this.classBtn = classBtn;
        this.checking = this.checking.bind(this);
        document.addEventListener("click", this.checking);

        if(document.documentElement.clientWidth > 991) { // setup inline style height for smooth animation
            this.setupSize();
        }
    }

    checking(event) {
        event.preventDefault(); // to prevent double click
        let btn = event.target.closest('[data-accordion-btn]');
        if(btn) {
            btn.classList.toggle(this.classBtn);
            this.revealer(event.target);
        }
    }

    revealer(btn) {
        let box = btn.closest('[data-accordion]');
        if(!box) return;
        let elem = box.querySelector('[data-accordion-content]');
        if(!elem) return;
        
        if(elem.dataset.accordionContent == "vertical") {
            elem.style.height = (elem.offsetHeight) ? 0 : elem.scrollHeight + 'px';
        }
        if(elem.dataset.accordionContent == "horisontal") {
            elem.style.width = (elem.style.width) ? 0 + 'px' : elem.scrollWidth + 'px';
        }
    }

    setupSize() {
        document.body.querySelectorAll('[data-accordion-content]').forEach(elem => {
            if(!elem.style.height) elem.style.height = elem.offsetHeight + 'px';
        });
    } 
};