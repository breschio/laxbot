import React from 'react';

// Fix import paths to use relative paths instead of alias paths
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { GameCard } from '@components/GameCard';
import { ThemeToggle } from '@components/ThemeToggle';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';

// Update Sidebar to use proper border colors
const Sidebar = ({ children }: { children: React.ReactNode }) => (
  <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-950 p-4 border-r border-gray-100 dark:border-gray-900 overflow-y-auto">
    <nav className="flex flex-col space-y-2">
      {children}
    </nav>
  </aside>
);

Sidebar.Link = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <a
    href={href}
    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md"
    aria-label={`Scroll to ${String(children)} section`}
    onClick={(e) => {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }}
  >
    {children}
  </a>
);

// Mock Game Data - Replace with actual data structure/fetching
const mockGameData = {
  id: '1',
  status: "final" as "scheduled" | "inProgress" | "final" | "postponed", // Properly typed status
  gameDate: new Date().toISOString(),
  teams: [
    {
      id: "team1",
      name: "Team A",
      abbreviation: "TA",
      logoUrl: "/placeholder-logo.png",
      score: 10,
      isHome: true
    },
    {
      id: "team2",
      name: "Team B",
      abbreviation: "TB",
      logoUrl: "/placeholder-logo.png",
      score: 8,
      isHome: false
    }
  ],
  venue: "Stadium X",
};

const ComponentsPage: React.FC = () => {
  return (
    <div className="flex h-full w-full">
      <Sidebar>
        {/* Alphabetically organized sidebar links */}
        <Sidebar.Link href="#Button">Button</Sidebar.Link>
        <Sidebar.Link href="#Card">Card</Sidebar.Link>
        <Sidebar.Link href="#GameCard">GameCard</Sidebar.Link>
        <Sidebar.Link href="#Sidebar">Sidebar</Sidebar.Link>
        <Sidebar.Link href="#Table">Table</Sidebar.Link>
        <Sidebar.Link href="#ThemeToggle">ThemeToggle</Sidebar.Link>
        <Sidebar.Link href="#ToggleGroup">ToggleGroup</Sidebar.Link>
      </Sidebar>

      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Component Showcase</h1>

          {/* Button Showcase */}
          <section id="Button" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Button</h2>
            <Card className="bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Standard button component with multiple variants.</p>
          </section>

          {/* Card Showcase */}
          <section id="Card" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Card</h2>
            <Card className="border border-gray-100 dark:border-gray-900 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Card Title</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">This is the content within a standard Shadcn Card.</p>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Basic container card from Shadcn/UI.</p>
          </section>

          {/* GameCard Showcase */}
          <section id="GameCard" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">GameCard</h2>
            <Card className="bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900">
              <CardContent className="p-6 flex justify-center">
                <div className="w-full max-w-md">
                  <GameCard {...mockGameData} />
                </div>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Displays game information.</p>
          </section>

          {/* Sidebar Showcase */}
          <section id="Sidebar" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sidebar</h2>
            <Card className="bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900 h-64">
              <CardContent className="p-0 h-full">
                {/* Rendering Sidebar structure for demonstration */}
                <div className="flex h-full">
                  <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-950 p-4 border-r border-gray-100 dark:border-gray-900">
                    <nav className="flex flex-col space-y-2">
                      <Sidebar.Link href="#">Demo Link A</Sidebar.Link>
                      <Sidebar.Link href="#">Demo Link B</Sidebar.Link>
                      <Sidebar.Link href="#">Demo Link C</Sidebar.Link>
                    </nav>
                  </div>
                  <div className="flex-1 p-4 bg-gray-950 dark:bg-gray-950">Sidebar content area</div>
                </div>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Basic sticky sidebar structure with smooth scroll links.</p>
          </section>

          {/* Table Showcase */}
          <section id="Table" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Table</h2>
            <Card className="bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900">
              <CardContent className="p-6">
                <Table>
                  <TableCaption>A list of team standings.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>W</TableHead>
                      <TableHead>L</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Warriors</TableCell>
                      <TableCell>9</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell className="text-right">81.8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sharks</TableCell>
                      <TableCell>7</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell className="text-right">63.6%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tigers</TableCell>
                      <TableCell>6</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell className="text-right">54.5%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Responsive, accessible table component for displaying data.</p>
          </section>

          {/* ThemeToggle Showcase */}
          <section id="ThemeToggle" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">ThemeToggle</h2>
            <Card className="border-gray-100 dark:border-gray-900">
              <CardContent className="p-6 flex items-center space-x-4">
                <ThemeToggle />
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between light and dark themes.</p>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Theme toggle component using next-themes.</p>
          </section>

          {/* ToggleGroup Showcase */}
          <section id="ToggleGroup" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">ToggleGroup</h2>
            <Card className="border-gray-100 dark:border-gray-900">
              <CardContent className="p-6">
                <ToggleGroup type="single" defaultValue="center">
                  <ToggleGroupItem value="left">Left</ToggleGroupItem>
                  <ToggleGroupItem value="center">Center</ToggleGroupItem>
                  <ToggleGroupItem value="right">Right</ToggleGroupItem>
                </ToggleGroup>
              </CardContent>
            </Card>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Toggle group for selecting from multiple options.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ComponentsPage; 