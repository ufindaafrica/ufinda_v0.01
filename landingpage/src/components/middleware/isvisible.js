import {  useEffect, useRef} from 'react';

export const IsVisible = () => {

    const sectionRef = useRef(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const elements = sectionRef.current.querySelectorAll(
            '.worksection, .pageheading, .pagetitle, .pagepara, .servicesection, .steps, .d-steps, .Bsteps, .demovideo, .stroketext, .worksBtn, .box, .servicesImage, .serviceBtn, .right, .left'
        );

        if (!('IntersectionObserver' in window)) {
            elements.forEAch((element) => element.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            }
        );
        elements.forEach((element) => {
            observer.observe(element);
        });

        return () => {
            elements.forEach((element) => observer.unobserve(element));
        };
    }, [])
}