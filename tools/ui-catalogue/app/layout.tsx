import '../../../src/app/globals.css';
import '../../../src/app/design-system.css';
import '../../../src/app/heroui-experiment.css';
import '../../../src/app/viewport.css';
import './catalogue.css';
import { Providers } from '../../../src/app/providers';
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body className="heroui-experiment"><Providers>{children}</Providers></body></html>;
}
