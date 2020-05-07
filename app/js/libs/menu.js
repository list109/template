function menu(btn, btnClass) {
    btn.onclick = () => {
            btn.classList.toggle(btnClass);
            document.body.classList.toggle(btn.dataset.bodyClass);
    }
};