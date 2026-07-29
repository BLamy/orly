import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, ease, stagger } from '../core';
import { Zone } from './zone';

/**
 * Zone catalog: a nested cloud topology draws on outside-in — provider →
 * region → two availability zones side by side → a VPC and subnet inside
 * one — then the other AZ dims, which is the whole point of the boxes:
 * each boundary is a failure domain.
 */
const PROVIDER = { x: 70, y: 36, w: 1140, h: 560 };
const REGION = { x: 100, y: 78, w: 1080, h: 490 };
const AZ_A = { x: 130, y: 122, w: 505, h: 418 };
const AZ_B = { x: 665, y: 122, w: 485, h: 418 };
const VPC = { x: 160, y: 168, w: 445, h: 340 };
const SUBNET = { x: 190, y: 216, w: 385, h: 260 };

function buildDemo() {
  const tl = new Timeline();
  const uProvider = tl.channel('uProvider', 0);
  const uRegion = tl.channel('uRegion', 0);
  const uAz = [tl.channel('uAzA', 0), tl.channel('uAzB', 0)];
  const uVpc = tl.channel('uVpc', 0);
  const uSubnet = tl.channel('uSubnet', 0);
  const dimB = tl.channel('dimB', 0);

  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 4.0,
    text: 'Boundaries draw outside-in: the cloud, a region, and two zones side by side.',
  });
  tl.tween(uProvider, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(uRegion, 1, { at: 1.2, dur: 1.3, ease: ease.draw });
  stagger(uAz.length, { at: 1.9, each: 0.3, dur: 1.2, ease: ease.draw }).forEach((o, i) =>
    tl.tween(uAz[i], 1, o),
  );
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 3.6,
    text: 'Zoom in and the pattern repeats: a VPC, and a subnet tucked inside it.',
  });
  tl.tween(uVpc, 1, { at: t - 3.3, dur: 1.2, ease: ease.draw });
  tl.tween(uSubnet, 1, { at: t - 2.6, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 4.4,
    text: 'Every box is a failure domain. When us-east-1b goes dark, nothing inside 1a has to care.',
  });
  tl.tween(dimB, 1, { at: t - 3.8, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, uProvider, uRegion, uAz, uVpc, uSubnet, dimB };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <>
            <Zone {...PROVIDER} kind="provider" label="aws" u={s.get(demo.uProvider)} />
            <Zone {...REGION} kind="region" label="us-east-1" u={s.get(demo.uRegion)} />
            <Zone {...AZ_A} kind="az" label="us-east-1a" u={s.get(demo.uAz[0])} />
            <Zone {...AZ_B} kind="az" label="us-east-1b" u={s.get(demo.uAz[1])} dim={s.get(demo.dimB)} />
            <Zone {...VPC} kind="vpc" label="vpc-prod" u={s.get(demo.uVpc)} />
            <Zone {...SUBNET} kind="subnet" label="private subnet" u={s.get(demo.uSubnet)} />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/Zone',
  component: Demo,
};
export default meta;

export const NestedTopology: StoryObj<typeof Demo> = {};
