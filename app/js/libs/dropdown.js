let dropdown = {
    handleEvent(event) {
        let box = event.target.closest('[data-dropdown]');
        if(this.box && !this.box.contains(box) && this.isDropdown) this.showDropdown();
        if(!box) return;
        this.box = box;

        this.list = box.querySelector('[data-dropdown-list]');
        let btn = box.querySelector('[data-dropdown-btn]');
        if(!this.list || !btn) return;

        event.preventDefault();

        if(event.target.closest('[data-dropdown-btn]')) {
            this.showDropdown();
        }

        let elem = event.target.closest('[data-dropdown-item]');
        if(elem) this.chooseDropdownItem(elem, btn);
    },
    chooseDropdownItem(elem, btn) {
        let elemChild = elem.innerHTML;
        let btnChild = btn.innerHTML;

        elem.innerHTML = btnChild;
        btn.innerHTML = elemChild;
        this.showDropdown();
    },
    showDropdown() {
        this.isDropdown = (parseFloat(this.list.style.height) == this.list.scrollHeight);
        this.list.style.height = (this.isDropdown) ? '' : this.list.scrollHeight + 'px';
        this.isDropdown = !this.isDropdown;
        this.list.dataset.dropdownList = this.isDropdown;
    }
}