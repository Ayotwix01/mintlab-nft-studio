"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  ImagePlus,
  Layers3,
  Menu,
  Search,
  Sparkles,
  Wallet,
  X,
  LogOut,
  Network,
  UploadCloud,
} from "lucide-react";
import { useWallet } from "@/src/hooks/useWallet";
import EnsLookup from "@/src/components/EnsLookup";
import PinataUploader from "@/src/components/PinataUploader";
import MintArtwork from "@/src/components/MintArtwork";
import { getMintedNFTs } from "@/src/lib/nftGallery";

const demoArtworks = [
  {
    id: 1,
    title: "Soft Geometry",
    artist: "studioform",
    initials: "SF",
    category: "Abstract",
    price: "0.08 ETH",
    image:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[4/5]",
  },
  {
    id: 2,
    title: "Sunday, Somewhere",
    artist: "alima.jpg",
    initials: "AM",
    category: "Photography",
    price: "0.12 ETH",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[3/4]",
  },
  {
    id: 3,
    title: "Notes from Earth",
    artist: "kosi.draws",
    initials: "KO",
    category: "Illustration",
    price: "0.04 ETH",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-square",
  },
  {
    id: 4,
    title: "Otherworldly Form",
    artist: "jx.objects",
    initials: "JX",
    category: "3D & Digital",
    price: "0.15 ETH",
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[4/5]",
  },
  {
    id: 5,
    title: "Blue Hour, Lagos",
    artist: "tobi.archive",
    initials: "TA",
    category: "Photography",
    price: "0.06 ETH",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[4/5]",
  },
  {
    id: 6,
    title: "Color Study 04",
    artist: "el.studio",
    initials: "EL",
    category: "Abstract",
    price: "0.09 ETH",
    image:
      "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-square",
  },
  {
    id: 7,
    title: "Pixel Garden",
    artist: "0xgarden",
    initials: "0X",
    category: "On-chain",
    price: "0.03 ETH",
    image:
      "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[3/4]",
  },
  {
    id: 8,
    title: "The Quiet Hours",
    artist: "m.nwosu",
    initials: "MN",
    category: "Illustration",
    price: "0.05 ETH",
    image:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=85",
    ratio: "aspect-[4/5]",
  },
];

const categories = [
  "All work",
  "Abstract",
  "Photography",
  "Illustration",
  "3D & Digital",
  "On-chain",
];

export default function Home() {
  const {
    address,
    chainId,
    isConnected,
    isSepolia,
    isConnecting,
    isSwitching,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    walletError,
  } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All work");
  const [saved, setSaved] = useState<number[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState("");
  const [allArtworks, setAllArtworks] = useState(demoArtworks);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    let active = true;

    getMintedNFTs()
      .then((minted) => {
        if (!active || minted.length === 0) return;

        const onChainArtworks = minted.map((nft, index) => ({
          id: 1000 + index,
          title: nft.title,
          artist: nft.artist,
          initials: nft.title.slice(0, 2).toUpperCase(),
          category: "On-chain",
          price: `Token #${nft.tokenId}`,
          image: nft.image,
          ratio: "aspect-[4/5]",
        }));

        setAllArtworks([...onChainArtworks, ...demoArtworks]);
      })
      .catch((error) => {
        console.error("Could not load minted NFTs:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredArtworks = useMemo(() => {
    return allArtworks.filter((artwork) => {
      const matchesSearch =
        `${artwork.title} ${artwork.artist} ${artwork.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All work" || artwork.category === category;

      const matchesSaved = !savedOnly || saved.includes(artwork.id);

      return matchesSearch && matchesCategory && matchesSaved;
    });
  }, [allArtworks, search, category, saved, savedOnly]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function toggleSaved(id: number) {
    const alreadySaved = saved.includes(id);

    setSaved((current) =>
      alreadySaved ? current.filter((item) => item !== id) : [...current, id],
    );

    notify(alreadySaved ? "Removed from your saved work" : "Artwork saved");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify("Image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleCreateSubmit() {
    if (!isConnected) {
      notify("Connect your wallet before preparing your artwork.");
      return;
    }

    if (!isSepolia) {
      notify("Switch your wallet to Sepolia first.");
      return;
    }

    if (!selectedFile) {
      notify("Choose an artwork image first.");
      return;
    }

    notify("Image selected. Connect the Pinata upload and mint contract next.");
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#20211c]">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-[#e6e4dc] bg-[#f7f6f2]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5 px-4 sm:px-7 lg:px-10">
          <a
            href="#discover"
            className="shrink-0 font-serif text-[29px] font-bold tracking-[-1.8px]"
          >
            MINT<span className="text-[#78953f]">LAB</span>
            <span className="text-[#a2c65a]">.</span>
          </a>
          <div className="relative hidden max-w-[480px] flex-1 md:block">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#85867d]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search art, artists, collections..."
              aria-label="Search artwork"
              className="h-11 w-full rounded-full border border-[#e5e3db] bg-[#eeede7] pl-11 pr-4 text-sm outline-none transition focus:border-[#9bb76a] focus:ring-2 focus:ring-[#c7f36b]/40"
            />
          </div>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-medium text-[#77786f] lg:flex">
            <a href="#discover" className="text-[#20211c]">
              Discover
            </a>
            <a href="#gallery" className="transition hover:text-[#20211c]">
              Gallery
            </a>
            <a href="#creators" className="transition hover:text-[#20211c]">
              Creators
            </a>
          </nav>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            className="ml-auto rounded-full border border-[#e3e1d8] p-2.5 lg:hidden"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          {mounted && isConnected ? (
            <div className="relative flex shrink-0 items-center gap-2">
              {/* Keep your existing connected-wallet content here */}
            </div>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="shrink-0 rounded-full bg-[#c7f36b] px-4 py-3 text-xs font-bold text-[#202719] transition hover:bg-[#b9e65d] disabled:cursor-wait disabled:opacity-60 sm:px-5"
            >
              {isConnecting ? "Connecting..." : "Connect wallet ↗"}
            </button>
          )}{" "}
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#e6e4dc] bg-[#f7f6f2] px-5 py-4 lg:hidden">
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85867d]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search artwork..."
                className="h-10 w-full rounded-full border border-[#e5e3db] bg-white pl-9 pr-3 text-sm outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="#discover" onClick={() => setMobileMenuOpen(false)}>
                Discover
              </a>
              <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>
                Gallery
              </a>
              <a href="#creators" onClick={() => setMobileMenuOpen(false)}>
                Creators
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main layout */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[205px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[#e6e4dc] px-5 py-8 lg:block">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#96968d]">
            Explore
          </p>

          <a
            href="#discover"
            className="mb-1 flex items-center gap-3 rounded-xl bg-[#eeede7] px-3 py-3 text-sm font-semibold"
          >
            <Compass size={18} />
            Discover
          </a>

          <a
            href="#gallery"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#77786f] transition hover:bg-[#eeede7] hover:text-[#20211c]"
          >
            <Sparkles size={18} />
            Trending art
          </a>

          <a
            href="#creators"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#77786f] transition hover:bg-[#eeede7] hover:text-[#20211c]"
          >
            <Layers3 size={18} />
            Creators
          </a>

          <div className="mb-4 mt-9 px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#96968d]">
            Your studio
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#77786f] transition hover:bg-[#eeede7] hover:text-[#20211c]"
          >
            <ImagePlus size={18} />
            Create artwork
          </button>

          <button
            type="button"
            onClick={() => {
              setSavedOnly((current) => !current);
              document
                .getElementById("gallery")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
              savedOnly
                ? "bg-[#e9efd9] font-semibold text-[#405329]"
                : "text-[#77786f] hover:bg-[#eeede7] hover:text-[#20211c]"
            }`}
          >
            <Bookmark size={18} />
            Saved pieces
            {saved.length > 0 && (
              <span className="ml-auto text-xs">{saved.length}</span>
            )}
          </button>

          <div className="mt-10 rounded-2xl border border-[#e5e3db] bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3df] text-[#5b7732]">
              <Wallet size={18} />
            </div>
            <p className="text-sm font-semibold">Your studio, on-chain.</p>
            <p className="mt-2 text-xs leading-5 text-[#85867d]">
              Connect your wallet to prepare your first NFT.
            </p>
            {mounted && !isConnected && (
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="mt-4 w-full rounded-lg border border-[#e5e3db] py-2.5 text-xs font-semibold transition hover:bg-[#f7f6f2] disabled:opacity-60"
              >
                {isConnecting ? "Connecting..." : "Connect wallet ↗"}
              </button>
            )}
            {mounted && isConnected && !isSepolia && (
              <button
                type="button"
                onClick={switchToSepolia}
                disabled={isSwitching}
                className="mt-4 w-full rounded-lg bg-[#20211c] py-2.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSwitching ? "Switching..." : "Switch to Sepolia"}
              </button>
            )}
            {mounted && isConnected && isSepolia && (
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#587535]">
                <Check size={14} /> Wallet ready
              </p>
            )}
          </div>

          <div className="mt-6 px-3 text-[10px] leading-5 text-[#a09f96]">
            BUILT FOR INDEPENDENT CREATORS
            <br />
            Sepolia testnet
          </div>
        </aside>

        {/* Page content */}
        <main className="min-w-0 px-4 pb-12 pt-6 sm:px-7 sm:pt-9 lg:px-10 lg:pt-10">
          {/* Hero */}
          <section
            id="discover"
            className="mb-12 grid items-center gap-7 md:grid-cols-[0.9fr_1.1fr] md:gap-9"
          >
            <div className="py-2 md:py-7">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#77786f]">
                <span className="h-2 w-2 rounded-full bg-[#8daf4b]" />
                THE INDEPENDENT ART MARKET
              </div>

              <h1 className="max-w-[570px] font-serif text-[52px] font-normal leading-[0.99] tracking-[-2.5px] sm:text-[64px] lg:text-[70px]">
                Good art.
                <br />
                Zero <span className="italic text-[#819d4d]">gatekeepers.</span>
              </h1>

              <p className="mt-6 max-w-[390px] text-sm leading-7 text-[#77786f] sm:text-[15px]">
                Find work worth looking at. Meet the people making it. When
                you&apos;re ready, put your own work on-chain.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 rounded-full bg-[#20211c] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3b3d34]"
                >
                  Explore the gallery
                  <ArrowDown size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#deddd5] px-5 py-3.5 text-sm font-semibold transition hover:bg-white"
                >
                  <ImagePlus size={16} />
                  Create a piece
                </button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-[#85867d]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e7ebdc] text-[#5d7835]">
                  <Network size={13} />
                </span>
                <span>Built for Ethereum · Sepolia testnet</span>
              </div>

              {walletError && (
                <p className="mt-4 max-w-sm break-words rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
                  Wallet: {walletError}
                </p>
              )}
            </div>

            <div className="group relative min-h-[300px] overflow-hidden bg-[#ded8c8] sm:min-h-[370px] md:min-h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=90"
                alt="Abstract contemporary painting"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />

              <div className="absolute left-5 top-5 flex items-center gap-2 bg-[#f7f6f2]/95 px-3 py-2 text-[10px] font-bold uppercase tracking-[1px]">
                <Sparkles size={13} />
                Featured work
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[2px] text-white/70">
                    STUDIO SPOTLIGHT · 001
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl">
                    Composition No. 08
                  </h2>
                  <p className="mt-2 text-xs text-white/75">
                    An exploration in colour and form
                  </p>
                </div>
                <div className="hidden shrink-0 border border-white/30 px-3 py-2 text-[10px] font-bold tracking-wide sm:block">
                  ART, REIMAGINED
                </div>
              </div>
            </div>
          </section>

          <EnsLookup />
          <div id="create" className="my-10 scroll-mt-24">
            <PinataUploader />
          </div>

          {/* Gallery heading */}
          <section id="gallery" className="scroll-mt-28">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#85867d]">
                  A LITTLE OF EVERYTHING
                </p>
                <h2 className="font-serif text-3xl tracking-[-0.8px] sm:text-[36px]">
                  Worth a closer look
                </h2>
                <p className="mt-2 text-sm text-[#85867d]">
                  Discover your next favourite piece.
                </p>
              </div>

              <span className="text-xs text-[#85867d]">
                {filteredArtworks.length} pieces
              </span>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                    category === item
                      ? "border-[#20211c] bg-[#20211c] text-white"
                      : "border-[#e1dfd7] bg-transparent text-[#77786f] hover:border-[#aaa99f] hover:text-[#20211c]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {savedOnly && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-[#e9efd9] px-4 py-3 text-sm text-[#405329]">
                <span className="font-medium">Showing your saved artwork</span>
                <button
                  type="button"
                  onClick={() => setSavedOnly(false)}
                  className="text-xs font-bold underline underline-offset-4"
                >
                  Show everything
                </button>
              </div>
            )}

            {/* Gallery grid */}
            {filteredArtworks.length > 0 ? (
              <div className="columns-2 gap-4 sm:columns-3 xl:columns-4">
                {filteredArtworks.map((artwork) => (
                  <article
                    key={artwork.id}
                    className="mb-5 inline-block w-full break-inside-avoid"
                  >
                    <div className="group relative overflow-hidden bg-[#e9e7df]">
                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        loading="lazy"
                        className={`${artwork.ratio} block w-full object-cover transition duration-500 group-hover:scale-[1.025]`}
                      />

                      <button
                        type="button"
                        onClick={() => toggleSaved(artwork.id)}
                        aria-label={
                          saved.includes(artwork.id)
                            ? "Remove saved artwork"
                            : "Save artwork"
                        }
                        className={`absolute right-3 top-3 flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold shadow-sm transition ${
                          saved.includes(artwork.id)
                            ? "bg-[#c7f36b] text-[#202719]"
                            : "bg-white/95 text-[#20211c] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        }`}
                      >
                        <Bookmark
                          size={14}
                          fill={
                            saved.includes(artwork.id) ? "currentColor" : "none"
                          }
                        />
                        {saved.includes(artwork.id) ? "Saved" : "Save"}
                      </button>

                      <div className="absolute bottom-3 left-3">
                        <span className="bg-[#f7f6f2]/95 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[#55564e]">
                          {artwork.category}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] font-bold tracking-[-0.2px]">
                          {artwork.title}
                        </h3>
                        <span className="shrink-0 text-[10px] font-semibold text-[#77786f]">
                          {artwork.price}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#85867d]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e0ded6] bg-white text-[9px] font-bold text-[#42443a]">
                          {artwork.initials}
                        </span>
                        <span>{artwork.artist}</span>
                        <ArrowUpRight
                          size={12}
                          className="ml-auto opacity-60"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#d9d7ce] px-5 py-16 text-center">
                <Search size={25} className="mx-auto mb-4 text-[#85867d]" />
                <h3 className="font-serif text-2xl">Nothing here just yet.</h3>
                <p className="mt-2 text-sm text-[#85867d]">
                  Try another search or category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All work");
                    setSavedOnly(false);
                  }}
                  className="mt-5 text-xs font-bold underline underline-offset-4"
                >
                  Reset filters
                </button>
              </div>
            )}
          </section>

          {/* Creator section */}
          <section
            id="creators"
            className="mt-16 border-y border-[#e3e1d9] py-10 sm:py-12"
          >
            <div className="grid gap-7 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[2px] text-[#85867d]">
                  PEOPLE MAKE THE CULTURE
                </p>
                <h2 className="max-w-lg font-serif text-3xl leading-tight tracking-[-0.8px] sm:text-4xl">
                  Made by people, not platforms.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#77786f]">
                  A home for independent artists and curious collectors.
                  Discover digital work, connect your wallet, and prepare to
                  bring your own creation on-chain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-[#c7f36b] px-5 py-3.5 text-sm font-bold text-[#202719] transition hover:bg-[#b9e65d] sm:justify-self-end"
              >
                Start creating
                <ArrowDownRight size={16} />
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col justify-between gap-3 pt-6 text-[11px] text-[#85867d] sm:flex-row sm:items-center">
            <span>© MINTLAB · Built for independent creators</span>
            <span>Sepolia testnet · Gallery artwork is illustrative</span>
          </footer>
        </main>
      </div>

      {/* Create artwork modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151610]/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCreateOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-[#e5e3db] bg-[#f7f6f2] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#85867d]">
                  YOUR CREATIVE SPACE
                </p>
                <h2
                  id="create-title"
                  className="font-serif text-3xl tracking-tight"
                >
                  Create a piece.
                </h2>
                <p className="mt-2 text-sm text-[#77786f]">
                  Start with the artwork you want to share.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close create modal"
                className="rounded-full border border-[#e1dfd7] p-2 transition hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <MintArtwork />
            <p className="mt-4 text-center text-[11px] leading-5 text-[#85867d]">
              Images and metadata are stored on IPFS; minting requires a Sepolia
              wallet transaction.
            </p>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[60] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-[#20211c] px-5 py-3 text-center text-xs font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
