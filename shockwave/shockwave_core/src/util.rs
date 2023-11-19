use std::collections::HashMap;
use std::hash::Hash;

pub type DynError = Box<dyn std::error::Error + Send + Sync>;

pub trait HashMapExt<K, V1, V2> {
    /// Computes the difference between the current hashmap and the other hashmap,
    /// emptying both the current and the other hashmap in the process. This will
    /// return a triple of items only in the current hashmap, items in both hashmaps,
    /// and items only in the other hashmap, respectively.
    fn difference(self, other: HashMap<K, V2>) -> (HashMap<K, V1>, HashMap<K, (V1, V2)>, HashMap<K, V2>);
}

impl<K, V1, V2> HashMapExt<K, V1, V2> for HashMap<K, V1>
where
    K: Eq + Hash,
{
    fn difference(mut self, mut other: HashMap<K, V2>) -> (HashMap<K, V1>, HashMap<K, (V1, V2)>, HashMap<K, V2>) {
        let only_self = self.extract_if(|x, _| !other.contains_key(x)).collect();
        let only_other = other.extract_if(|x, _| !self.contains_key(x)).collect();

        // Remainder is only common elements.
        let mut common = HashMap::with_capacity(self.len());
        for (k, v1) in self.drain() {
            let v2 = other.remove(&k).expect("Non-common element in remainder");
            common.insert(k, (v1, v2));
        }

        (only_self, common, only_other)
    }
}

#[cfg(test)]
mod test {
    use std::collections::HashMap;

    use crate::util::HashMapExt;

    // Sourced from https://stackoverflow.com/questions/27582739/how-do-i-create-a-hashmap-literal
    macro_rules! map {
        ($($k:expr => $v:expr),* $(,)?) => {
            std::iter::Iterator::collect([$(($k, $v),)*].into_iter())
        }
    }

    #[test]
    fn difference() {
        let a: HashMap<_, _> = map! { 0 => 0, 1 => 1, 2 => 2, 3 => 3 };
        let b: HashMap<_, _> = map! { 2 => "3", 3 => "2", 4 => "4" };

        let (only_a, common, only_b) = a.difference(b);

        assert_eq!(only_a, map! { 0 => 0, 1 => 1 });
        assert_eq!(only_b, map! { 4 => "4" });
        assert_eq!(common, map! { 2 => (2, "3"), 3 => (3, "2") });
    }
}
