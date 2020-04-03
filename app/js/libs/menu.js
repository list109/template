function menu(btn, btnClass, {
    elements,
    classList,
}) {
    btn.onclick = () => {
        if(!btn.classList.contains(btnClass)) {
            let coords = btn.getBoundingClientRect();
            btn.style.left = coords.left + 'px';
            btn.style.top = coords.top + 'px';
        } else {
            btn.style.top = btn.style.left = "";
        }
        btn.classList.toggle(btnClass);
        elements.forEach((item, i) => {
            if(classList[i])item.classList.toggle(classList[i]);
        });
    }
};