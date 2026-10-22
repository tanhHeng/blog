import { onPageLoad } from '../lib/pageLifecycle';

interface Friend {
  name: string;
  url: string;
}

// Footer friend links: each `[data-friend-rotator]` link cycles through its `data-friends` JSON list.
// The link needs a `.footnote-friend-name` child; its styles should transition `width`.
onPageLoad((scope) => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-friend-rotator]')) {
    const friends: Friend[] = JSON.parse(link.dataset.friends ?? '[]');
    const name = link.querySelector<HTMLElement>('.footnote-friend-name');
    if (friends.length < 2 || !name) continue;
    let index = 0;

    const show = () => {
      index = (index + 1) % friends.length;
      link.href = friends[index].url;
      name.textContent = friends[index].name;
    };
    let animation: Animation | undefined;
    const roll = (keyframes: Keyframe[]) => {
      animation = name.animate(keyframes, { duration: 260, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
      return animation.finished;
    };
    scope.cleanup(() => animation?.cancel());

    // Like a scrolling counter: the old name drops out downwards, the new one rolls in from above,
    // while the link width eases to the new name so neighbouring links glide into place.
    const switchFriend = async () => {
      link.style.width = `${link.getBoundingClientRect().width}px`;
      await roll([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 0.25rem' }]);
      show();
      link.style.width = `${name.getBoundingClientRect().width}px`;
      await roll([{ opacity: 0, translate: '0 -0.25rem' }, { opacity: 1, translate: '0 0' }]);
    };

    const cycle = () => {
      // Hold while hovered/focused so it never changes under the pointer; skip while hidden (e.g. desktop homepage).
      if (link.offsetParent && !link.matches(':hover, :focus-visible')) {
        if (reducedMotion.matches) show();
        else switchFriend().catch(() => {});
      }
      scope.timeout(cycle, 3000);
    };
    scope.timeout(cycle, 3000);
    scope.cleanup(() => link.style.removeProperty('width'));
  }
});
