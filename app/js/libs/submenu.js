let submenu = {

    handleEvent(event) {
        if(event.type = 'mouseover') this.setSubmenu(event.target);
        if(event.type = 'mouseout') this.removeSubmenu(event.target);
    },

    setSubmenu(elem) {
        if(this.isSubmenu) return;

        this.menuItem = elem.closest('[data-submenu]');
        if(!this.menuItem) return;
        
        let submenuItem = this.menuItem.querySelector('.submenu');
        if(!submenuItem) return;

        let coords = submenuItem.getBoundingClientRect();
        let overEdge = document.documentElement.clientWidth - (coords.left + submenuItem.offsetWidth);
        submenuItem.style.left = (overEdge < 0) ? overEdge - 15 + 'px' : '';

        this.isSubmenu = true;
    },

    removeSubmenu(elem) {
        if(!this.isSubmenu) return;
        
        if(!this.menuItem.contains(elem)) return;

        this.isSubmenu = false;
    }

}